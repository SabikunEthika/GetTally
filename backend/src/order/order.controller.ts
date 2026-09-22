import {
  Controller,
  Post,
  Get,
  Body,
  UseInterceptors,
  UploadedFile,
  Param,
  Patch,
  BadRequestException,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { OrderService } from './order.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('api/orders')
@UseGuards(AuthGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) { }

  @Post('voice/upload')
  @UseInterceptors(FileInterceptor('audio'))
  async uploadVoiceOrder(
    @UploadedFile() file: any,
    @Req() request: { user: { sellerId: number } },
  ) {
    const result = await this.orderService.uploadVoiceOrder(
      file,
      request.user.sellerId,
    );
    return result;
  }

  @Post('extract')
  async extractOrder(
    @Body('transcript') transcript: string,
    @Req() request: { user: { sellerId: number } },
  ) {
    if (!transcript) {
      throw new BadRequestException('transcript is required');
    }

    const result = await this.orderService.extractOrderFromTranscript(
      transcript,
      request.user.sellerId,
    );
    return result;
  }

  @Post('confirm')
  async confirmOrder(
    @Body('orderData') orderData: {
      customerName: string;
      product: string;
      quantity: number;
      unitPrice: number;
      costPrice?: number;
      deliveryAddress: string;
    },
    @Req() request: { user: { sellerId: number } },
  ) {
    if (!orderData) {
      throw new BadRequestException('orderData is required');
    }

    const result = await this.orderService.confirmAndSaveOrder(
      orderData,
      request.user.sellerId,
    );
    return result;
  }

  @Patch(':orderId/status')
  async updateStatus(
    @Param('orderId') orderId: string,
    @Body('status') status: string,
    @Body('returnReason') returnReason?: string,
    @Req() request?: { user: { sellerId: number } },
  ) {
    return this.orderService.updateOrderStatus(parseInt(orderId), request!.user.sellerId, status, returnReason);
  }

  @Get('seller/:sellerId')
  async getSellerOrders(@Param('sellerId') sellerId: string, @Req() request: { user: { sellerId: number } }) {
    const result = await this.orderService.getOrdersForSeller(
      request.user.sellerId,
    );
    return result;
  }

  @Get('stats/:sellerId')
  async getSellerStats(@Param('sellerId') _sellerId: string, @Req() request: { user: { sellerId: number } }) {
    const result = await this.orderService.getOrderStats(request.user.sellerId);
    return result;
  }

  @Get('report/:sellerId')
  async getReport(@Param('sellerId') _sellerId: string, @Req() request: { user: { sellerId: number } }) {
    return this.orderService.getReport(request.user.sellerId);
  }

  @Post('voice/transcribe')
  async transcribeVoice(@Body('audioFilePath') audioFilePath: string) {
    if (!audioFilePath) {
      throw new BadRequestException('audioFilePath is required');
    }

    const result = await this.orderService.transcribeAudio(audioFilePath);
    return result;
  }
}
