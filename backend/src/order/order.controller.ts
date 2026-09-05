import {
  Controller,
  Post,
  Get,
  Body,
  UseInterceptors,
  UploadedFile,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { OrderService } from './order.service';

@Controller('api/orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) { }

  @Post('voice/upload')
  @UseInterceptors(FileInterceptor('audio'))
  async uploadVoiceOrder(
    @UploadedFile() file: any,
    @Body('sellerId') sellerId: string,
  ) {
    if (!sellerId) {
      throw new BadRequestException('sellerId is required');
    }

    const result = await this.orderService.uploadVoiceOrder(
      file,
      parseInt(sellerId),
    );
    return result;
  }

  @Post('extract')
  async extractOrder(
    @Body('transcript') transcript: string,
    @Body('sellerId') sellerId: string,
  ) {
    if (!transcript || !sellerId) {
      throw new BadRequestException('transcript and sellerId are required');
    }

    const result = await this.orderService.extractOrderFromTranscript(
      transcript,
      parseInt(sellerId),
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
      deliveryAddress: string;
    },
    @Body('sellerId') sellerId: string,
  ) {
    if (!orderData || !sellerId) {
      throw new BadRequestException('orderData and sellerId are required');
    }

    const result = await this.orderService.confirmAndSaveOrder(
      orderData,
      parseInt(sellerId),
    );
    return result;
  }

  @Get('seller/:sellerId')
  async getSellerOrders(@Param('sellerId') sellerId: string) {
    const result = await this.orderService.getOrdersForSeller(
      parseInt(sellerId),
    );
    return result;
  }

  @Get('stats/:sellerId')
  async getSellerStats(@Param('sellerId') sellerId: string) {
    const result = await this.orderService.getOrderStats(parseInt(sellerId));
    return result;
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