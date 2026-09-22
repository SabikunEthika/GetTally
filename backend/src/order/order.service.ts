import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

type OrderInput = {
  customerName: string;
  product: string;
  quantity: number;
  unitPrice: number;
  costPrice?: number;
  deliveryAddress?: string;
  source?: 'voice' | 'chat';
};

const runFile = promisify(execFile);
const validStatuses = ['confirmed', 'delivered', 'returned', 'cancelled'];

@Injectable()
export class OrderService {
  private readonly prisma = new PrismaClient();
  private readonly uploadsDir = path.join(process.cwd(), 'uploads');

  constructor() {
    fs.mkdirSync(this.uploadsDir, { recursive: true });
  }

  async uploadVoiceOrder(file: any, sellerId: number) {
    if (!file) throw new BadRequestException('An audio file is required');
    await this.ensureSeller(sellerId);
    const extension = this.extensionFor(file.mimetype);
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${extension}`;
    const filepath = path.join(this.uploadsDir, filename);
    await fs.promises.writeFile(filepath, file.buffer);
    return { success: true, data: { sellerId, filename, filepath, originalName: file.originalname, mimeType: file.mimetype, size: file.size } };
  }

  async extractOrderFromTranscript(transcript: string, sellerId: number) {
    await this.ensureSeller(sellerId);
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return { success: false, message: 'GEMINI_API_KEY is not configured' };

    const prompt = `You extract potential sales orders for a Bangladeshi social seller. The text can be Bangla, Banglish, or English. Return JSON only, matching this exact shape:
{"intent":"inquiry|order_intent|order_confirmed|other","customerName":"string|null","product":"string|null","quantity":number|null,"unitPrice":number|null,"deliveryAddress":"string|null","confidence":"low|medium|high","reason":"short string"}
Use order_confirmed only if the buyer clearly commits to buy. Use inquiry if they only ask availability, size, or price. Never invent details; use null for missing fields. Prices are Bangladeshi taka per item.
Text:
${transcript}`;

    try {
      const content = await this.generateGeminiText(prompt, apiKey);
      if (!content) return { success: false, message: 'Gemini returned no usable response' };
      const data = JSON.parse(content.replace(/```json|```/g, '').trim());
      const isCandidate = ['order_intent', 'order_confirmed'].includes(data.intent);
      return { success: true, data, isOrderCandidate: isCandidate, requiresConfirmation: isCandidate };
    } catch (error: any) {
      return { success: false, message: 'Could not analyze this text', error: error.message || 'Gemini request failed' };
    }
  }

  async confirmAndSaveOrder(orderData: OrderInput, sellerId: number) {
    this.validateOrder(orderData);
    await this.ensureSeller(sellerId);
    const normalizedName = orderData.product.trim();
    const result = await this.prisma.$transaction(async (tx) => {
      const existingProduct = await tx.product.findFirst({ where: { sellerId, name: normalizedName } });
      const product = existingProduct
        ? await tx.product.update({ where: { id: existingProduct.id }, data: { price: orderData.unitPrice, ...(orderData.costPrice !== undefined ? { costPrice: orderData.costPrice } : {}) } })
        : await tx.product.create({ data: { name: normalizedName, price: orderData.unitPrice, costPrice: orderData.costPrice, sellerId } });
      const conversation = await tx.conversation.create({ data: { platform: orderData.source || 'manual', sellerId } });
      return tx.order.create({
        data: {
          customerName: orderData.customerName.trim(), totalPrice: orderData.quantity * orderData.unitPrice,
          status: 'confirmed', deliveryAddress: orderData.deliveryAddress?.trim() || 'Not provided', sellerId,
          conversationId: conversation.id,
          orderItems: { create: [{ quantity: orderData.quantity, unitPrice: orderData.unitPrice, productId: product.id }] },
        },
        include: { orderItems: { include: { product: true } } },
      });
    });
    return { success: true, message: 'Order confirmed and saved', orderId: result.id, data: result };
  }

  async getOrdersForSeller(sellerId: number) {
    const orders = await this.prisma.order.findMany({ where: { sellerId }, include: { orderItems: { include: { product: true } } }, orderBy: { createdAt: 'desc' } });
    return { success: true, data: orders };
  }

  async updateOrderStatus(orderId: number, sellerId: number, status: string, returnReason?: string) {
    if (!validStatuses.includes(status)) throw new BadRequestException('Invalid order status');
    if (status === 'returned' && !returnReason?.trim()) throw new BadRequestException('A return reason is required');
    const existing = await this.prisma.order.findFirst({ where: { id: orderId, sellerId } });
    if (!existing) throw new BadRequestException('Order not found');
    const order = await this.prisma.order.update({
      where: { id: existing.id }, data: { status, returnReason: status === 'returned' ? returnReason!.trim() : null },
      include: { orderItems: { include: { product: true } } },
    });
    return { success: true, data: order };
  }

  async getOrderStats(sellerId: number) {
    const orders = await this.prisma.order.findMany({ where: { sellerId }, include: { orderItems: { include: { product: true } } } });
    const saleOrders = orders.filter((order) => ['confirmed', 'delivered'].includes(order.status));
    const revenue = saleOrders.reduce((total, order) => total + order.totalPrice, 0);
    const knownCost = saleOrders.reduce((total, order) => total + order.orderItems.reduce((sum, item) => sum + (((item.product as typeof item.product & { costPrice?: number | null }).costPrice) ?? 0) * item.quantity, 0), 0);
    const costTrackedItems = saleOrders.flatMap((order) => order.orderItems).filter((item) => ((item.product as typeof item.product & { costPrice?: number | null }).costPrice) != null).reduce((sum, item) => sum + item.quantity, 0);
    const returnedOrders = orders.filter((order) => order.status === 'returned');
    const topProduct = this.topProduct(saleOrders);
    return { success: true, data: {
      totalOrders: orders.length, confirmedOrders: saleOrders.length, deliveredOrders: orders.filter((o) => o.status === 'delivered').length,
      returnedOrders: returnedOrders.length, cancelledOrders: orders.filter((o) => o.status === 'cancelled').length,
      totalEarnings: revenue, profit: costTrackedItems ? revenue - knownCost : null, costTrackedItems,
      returnRate: orders.length ? Number(((returnedOrders.length / orders.length) * 100).toFixed(1)) : 0,
      topProduct,
    } };
  }

  async getReport(sellerId: number) {
    const orders = await this.prisma.order.findMany({ where: { sellerId }, include: { orderItems: { include: { product: true } } }, orderBy: { createdAt: 'asc' } });
    const monthly = new Map<string, number>();
    for (const order of orders.filter((o) => ['confirmed', 'delivered'].includes(o.status))) {
      const key = order.createdAt.toISOString().slice(0, 7);
      monthly.set(key, (monthly.get(key) || 0) + order.totalPrice);
    }
    const stats = await this.getOrderStats(sellerId);
    const data = stats.data;
    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentRevenue = monthly.get(currentMonth) || 0;
    const previousMonthDate = new Date();
    previousMonthDate.setMonth(previousMonthDate.getMonth() - 1);
    const previousRevenue = monthly.get(previousMonthDate.toISOString().slice(0, 7)) || 0;
    const growthPercent = previousRevenue ? Number((((currentRevenue - previousRevenue) / previousRevenue) * 100).toFixed(1)) : null;
    const summary = `You have ${data.confirmedOrders} active sales worth ৳${data.totalEarnings.toLocaleString()}. ${data.topProduct ? `${data.topProduct.name} is your top seller.` : 'Log an order to see your top seller.'} ${data.returnedOrders ? `${data.returnedOrders} order${data.returnedOrders === 1 ? ' was' : 's were'} returned.` : 'No returns recorded yet.'}`;
    return { success: true, data: { ...data, monthlySales: [...monthly].map(([month, revenue]) => ({ month, revenue })), currentMonthRevenue: currentRevenue, growthPercent, summary } };
  }

  async transcribeAudio(audioFilePath: string) {
    if (!path.resolve(audioFilePath).startsWith(path.resolve(this.uploadsDir))) throw new BadRequestException('Invalid audio file path');
    const whisperPath = process.env.WHISPER_PATH;
    const modelPath = process.env.WHISPER_MODEL_PATH;
    if (!whisperPath || !modelPath) return { success: false, message: 'Set WHISPER_PATH and WHISPER_MODEL_PATH in backend/.env' };
    const wavPath = audioFilePath.replace(/\.[^/.]+$/, '.wav');
    const inputPath = audioFilePath.endsWith('.webm') ? wavPath : audioFilePath;
    try {
      if (audioFilePath.endsWith('.webm')) {
        if (!process.env.FFMPEG_PATH) return { success: false, message: 'Set FFMPEG_PATH in backend/.env for WebM recordings' };
        await runFile(process.env.FFMPEG_PATH, ['-i', audioFilePath, '-acodec', 'pcm_s16le', '-ar', '16000', wavPath, '-y']);
      }
      await runFile(whisperPath, ['-m', modelPath, '-l', 'auto', '-otxt', inputPath]);
      const outputPath = `${inputPath}.txt`;
      const transcript = await fs.promises.readFile(outputPath, 'utf8');
      await Promise.allSettled([fs.promises.unlink(outputPath), ...(inputPath !== audioFilePath ? [fs.promises.unlink(inputPath)] : [])]);
      return { success: true, data: { transcript: transcript.trim(), language: 'auto' } };
    } catch (error: any) {
      return { success: false, message: 'Audio transcription failed', error: error.message };
    }
  }

  private async ensureSeller(sellerId: number) {
    if (!Number.isInteger(sellerId) || sellerId < 1) throw new BadRequestException('A valid sellerId is required');
    const seller = await this.prisma.seller.findUnique({ where: { id: sellerId } });
    if (!seller) throw new BadRequestException(`Seller ${sellerId} was not found`);
  }
  private async generateGeminiText(prompt: string, apiKey: string) {
    const normalizeModel = (model: string) => {
      const clean = model.replace(/^models\//, '').trim();
      // Keep an old local .env from routing requests to retired Gemini 2.x IDs.
      return clean === 'gemini-2.0-flash' || clean.startsWith('gemini-1.5-') ? 'gemini-3.6-flash' : clean;
    };
    const configured = (process.env.GEMINI_MODEL || 'gemini-3.6-flash').split(',').map(normalizeModel).filter(Boolean);
    const fallback = (process.env.GEMINI_FALLBACK_MODELS || 'gemini-3.7-flash,gemini-3.5-flash').split(',').map(normalizeModel).filter(Boolean);
    const models = [...new Set([...configured, ...fallback])];
    let lastError = 'Gemini request failed';
    for (const model of models) {
      try {
        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          { contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json', temperature: 0 } },
          { headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey }, timeout: 30000 },
        );
        const content = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (content) return content;
        lastError = `${model} returned no content`;
      } catch (error: any) {
        lastError = error.response?.data?.error?.message || error.message || lastError;
        const status = error.response?.status;
        const retiredModel = /no longer available|not found|unknown model|high demand|temporarily unavailable/i.test(lastError);
        if (![404, 429, 500, 502, 503, 504].includes(status) && !retiredModel) throw new Error(lastError);
      }
    }
    throw new Error(`Gemini models are temporarily unavailable. Tried: ${models.join(', ')}. ${lastError}`);
  }
  private validateOrder(order: OrderInput) {
    if (!order.customerName?.trim() || !order.product?.trim()) throw new BadRequestException('Customer and product are required');
    if (!Number.isInteger(Number(order.quantity)) || Number(order.quantity) < 1) throw new BadRequestException('Quantity must be at least 1');
    if (!Number.isFinite(Number(order.unitPrice)) || Number(order.unitPrice) <= 0) throw new BadRequestException('Unit price must be greater than 0');
  }
  private extensionFor(mime: string) { return ({ 'audio/wav': '.wav', 'audio/mpeg': '.mp3', 'audio/ogg': '.ogg', 'audio/mp4': '.m4a' } as Record<string, string>)[mime] || '.webm'; }
  private topProduct(orders: any[]) {
    const quantities = new Map<string, number>();
    orders.flatMap((o) => o.orderItems).forEach((item) => quantities.set(item.product.name, (quantities.get(item.product.name) || 0) + item.quantity));
    const [name, quantity] = [...quantities.entries()].sort((a, b) => b[1] - a[1])[0] || [];
    return name ? { name, quantity } : null;
  }
}
