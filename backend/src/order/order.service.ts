import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class OrderService {
    private prisma = new PrismaClient();
    private uploadsDir = path.join(process.cwd(), 'uploads');

    constructor() {
        if (!fs.existsSync(this.uploadsDir)) {
            fs.mkdirSync(this.uploadsDir, { recursive: true });
        }
    }

    async uploadVoiceOrder(
        file: any,
        sellerId: number,
    ) {
        try {
            if (!file) {
                return {
                    success: false,
                    message: 'No file uploaded',
                };
            }

            const filename = `${Date.now()}-${file.originalname}`;
            const filepath = path.join(this.uploadsDir, filename);
            fs.writeFileSync(filepath, file.buffer);

            const audioRecord = {
                sellerId,
                filename,
                filepath,
                originalName: file.originalname,
                mimeType: file.mimetype,
                size: file.size,
                uploadedAt: new Date(),
            };

            return {
                success: true,
                message: 'Audio uploaded successfully',
                data: audioRecord,
                nextStep: 'Send to speech-to-text (whisper.cpp)',
            };
        } catch (error: any) {
            return {
                success: false,
                message: 'Error uploading audio',
                error: error.message || 'Unknown error',
            };
        }
    }

    async extractOrderFromTranscript(
        transcript: string,
        sellerId: number,
    ) {
        try {
            const axios = require('axios');
            const apiKey = process.env.GEMINI_API_KEY;

            if (!apiKey) {
                return {
                    success: false,
                    message: 'Gemini API key not configured',
                };
            }

            const prompt = `Extract order information from this transcript. Return ONLY a JSON object with these exact fields (no other text, no markdown, no extra formatting):
{
  "customerName": "string",
  "product": "string",
  "quantity": number,
  "unitPrice": number,
  "deliveryAddress": "string"
}

Transcript: "${transcript}"

Rules:
- Extract customer name
- Extract product name
- Extract quantity as number
- Extract unit price in taka as number
- Extract delivery address
- Return ONLY valid JSON`;

            const response = await axios.post(
                `https://generativelanguage.googleapis.com/v1/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
                {
                    contents: [
                        {
                            parts: [
                                {
                                    text: prompt,
                                },
                            ],
                        },
                    ],
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                },
            );

            const content = response.data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!content) {
                return {
                    success: false,
                    message: 'No response from Gemini',
                };
            }

            const extraction = JSON.parse(content);

            return {
                success: true,
                data: extraction,
                message: 'Order extracted from transcript using Gemini AI',
                requiresConfirmation: true,
            };
        } catch (error: any) {
            console.error('Gemini extraction error:', error.message);
            return {
                success: false,
                message: 'Error extracting order with Gemini',
                error: error.message || 'Unknown error',
            };
        }
    }

    async confirmAndSaveOrder(
        orderData: {
            customerName: string;
            product: string;
            quantity: number;
            unitPrice: number;
            deliveryAddress: string;
        },
        sellerId: number,
    ) {
        try {
            const totalPrice = orderData.quantity * orderData.unitPrice;

            const conversation = await this.prisma.conversation.create({
                data: {
                    platform: 'voice',
                    seller: {
                        connect: { id: sellerId },
                    },
                },
            });

            const product = await this.prisma.product.findFirst({
                where: {
                    name: orderData.product,
                    sellerId,
                },
            });

            let productId: number;

            if (product) {
                productId = product.id;
            } else {
                const newProduct = await this.prisma.product.create({
                    data: {
                        name: orderData.product,
                        price: orderData.unitPrice,
                        seller: {
                            connect: { id: sellerId },
                        },
                    },
                });
                productId = newProduct.id;
            }

            const order = await this.prisma.order.create({
                data: {
                    customerName: orderData.customerName,
                    totalPrice,
                    status: 'confirmed',
                    deliveryAddress: orderData.deliveryAddress,
                    seller: {
                        connect: { id: sellerId },
                    },
                    conversation: {
                        connect: { id: conversation.id },
                    },
                    orderItems: {
                        create: [
                            {
                                quantity: orderData.quantity,
                                unitPrice: orderData.unitPrice,
                                product: {
                                    connect: { id: productId },
                                },
                            },
                        ],
                    },
                },
                include: {
                    orderItems: {
                        include: {
                            product: true,
                        },
                    },
                },
            });

            return {
                success: true,
                message: 'Order saved successfully',
                orderId: order.id,
                data: order,
            };
        } catch (error: any) {
            return {
                success: false,
                message: 'Error saving order',
                error: error.message || 'Unknown error',
            };
        }
    }

    async getOrdersForSeller(sellerId: number) {
        try {
            const orders = await this.prisma.order.findMany({
                where: {
                    sellerId,
                },
                include: {
                    orderItems: {
                        include: {
                            product: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });

            return {
                success: true,
                data: orders,
            };
        } catch (error: any) {
            return {
                success: false,
                message: 'Error fetching orders',
                error: error.message || 'Unknown error',
            };
        }
    }

    async getOrderStats(sellerId: number) {
        try {
            const totalSales = await this.prisma.order.count({
                where: {
                    sellerId,
                    status: 'confirmed',
                },
            });

            const totalEarnings = await this.prisma.order.aggregate({
                where: {
                    sellerId,
                    status: 'confirmed',
                },
                _sum: {
                    totalPrice: true,
                },
            });

            const returnedOrders = await this.prisma.order.count({
                where: {
                    sellerId,
                    status: 'returned',
                },
            });

            return {
                success: true,
                data: {
                    totalOrders: totalSales,
                    totalEarnings: totalEarnings._sum.totalPrice || 0,
                    returnedOrders,
                },
            };
        } catch (error: any) {
            return {
                success: false,
                message: 'Error fetching stats',
                error: error.message || 'Unknown error',
            };
        }
    }

    async transcribeAudio(audioFilePath: string) {
        try {
            const { exec } = require('child_process');
            const util = require('util');
            const execPromise = util.promisify(exec);
            const fs = require('fs');
            const path = require('path');

            const whisperPath = 'E:\\AUST\\Club\\CSE Carnival 8\\Project Exhibition\\Release\\whisper-cli.exe';
            const modelPath = 'E:\\AUST\\Club\\CSE Carnival 8\\Project Exhibition\\Release\\models\\ggml-small.bin';
            const releaseDir = 'E:\\AUST\\Club\\CSE Carnival 8\\Project Exhibition\\Release';

            // Change working directory to Release folder
            const command = `cd "${releaseDir}" && "${whisperPath}" -m "${modelPath}" -l bn -otxt "${audioFilePath}"`;

            const { stdout, stderr } = await execPromise(command);

            // Whisper saves as: audioFilePath + '.txt'
            const outputFile = audioFilePath + '.txt';

            console.log('Looking for output file:', outputFile);

            // Check if file exists
            if (!fs.existsSync(outputFile)) {
                return {
                    success: false,
                    message: 'Output file not created',
                    error: `File not found: ${outputFile}`,
                };
            }

            // Read the output text file
            const transcript = fs.readFileSync(outputFile, 'utf-8').trim();

            console.log('Transcript:', transcript);

            // Clean up temporary file
            try {
                fs.unlinkSync(outputFile);
            } catch (e) {
                console.log('Could not delete temp file:', e);
            }

            return {
                success: true,
                message: 'Audio transcribed successfully',
                data: {
                    transcript,
                    language: 'Bengali',
                    confidence: 'high',
                },
            };
        } catch (error: any) {
            console.error('Transcription error:', error);
            return {
                success: false,
                message: 'Error transcribing audio',
                error: error.message || 'Unknown error',
            };
        }
    }
}