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
            const mockExtraction = {
                customerName: 'Rima',
                product: 'Printed Kurti',
                quantity: 2,
                unitPrice: 1250,
                deliveryAddress: 'Mirpur',
                totalPrice: 2500,
            };

            return {
                success: true,
                data: mockExtraction,
                message: 'Order extracted from transcript',
                requiresConfirmation: true,
            };
        } catch (error: any) {
            return {
                success: false,
                message: 'Error extracting order',
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
}