import { Module } from '@nestjs/common';
import { ItemsController } from './items.controller';
import { ItemsService } from './items.service';
import { AuthModule } from '../auth/auth.module';
import { StorageModule } from '../storage/storage.module';
import { OptionalJwtGuard } from '../common/guards/optional-jwt.guard';

@Module({
  imports: [AuthModule, StorageModule],
  controllers: [ItemsController],
  providers: [ItemsService, OptionalJwtGuard],
})
export class ItemsModule {}
