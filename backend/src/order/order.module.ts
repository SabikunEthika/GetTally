import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';

@Module({
  imports: [
    MulterModule.register({
      storage: undefined,
      limits: {
        fileSize: 50 * 1024 * 1024,
      },
    }),
  ],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}