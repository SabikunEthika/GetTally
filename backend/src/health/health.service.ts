import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class HealthService {
    private prisma = new PrismaClient();

    async check() {
        try {
            await this.prisma.$queryRaw`SELECT 1`;
            return {
                status: 'ok',
                message: 'GetTally backend is running',
                database: 'connected',
                timestamp: new Date().toISOString(),
            };
        } catch (error: any) {
            return {
                status: 'error',
                message: 'GetTally backend is running but database connection failed',
                database: 'disconnected',
                error: error.message || 'Unknown error',
                timestamp: new Date().toISOString(),
            };
        }
    }
}