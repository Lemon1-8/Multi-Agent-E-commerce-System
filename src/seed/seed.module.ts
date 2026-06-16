import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { Product } from '../infrastructure/database/entities/product.entity';
import { Customer } from '../infrastructure/database/entities/customer.entity';
import { ProductEmbedding } from '../infrastructure/database/vector-entities/product-embedding.entity';
import { MarketEmbedding } from '../infrastructure/database/vector-entities/market-embedding.entity';
import { FaqEmbedding } from '../infrastructure/database/vector-entities/faq-embedding.entity';
import { SeedService } from './seed.service';
import { ProductGenerator } from './generators/product.generator';
import { MarketGenerator } from './generators/market.generator';
import { FaqGenerator } from './generators/faq.generator';
import { CustomerGenerator } from './generators/customer.generator';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    InfrastructureModule,
    TypeOrmModule.forFeature([Product, Customer, ProductEmbedding, MarketEmbedding, FaqEmbedding]),
  ],
  providers: [SeedService, ProductGenerator, MarketGenerator, FaqGenerator, CustomerGenerator],
})
export class SeedModule {}
