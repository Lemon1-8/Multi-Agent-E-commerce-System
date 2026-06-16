import { NestFactory } from '@nestjs/core';
import { SeedModule } from './seed.module';
import { SeedService } from './seed.service';

async function main() {
  console.log('开始播种数据...\n');
  const app = await NestFactory.createApplicationContext(SeedModule);
  const seedService = app.get(SeedService);
  try {
    await seedService.seed();
    console.log('\n播种完成!');
  } catch (err) {
    console.error('播种失败:', err);
    process.exit(1);
  } finally {
    await app.close();
  }
}
main();
