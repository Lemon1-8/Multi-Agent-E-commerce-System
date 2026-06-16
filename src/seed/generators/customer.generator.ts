import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../../infrastructure/database/entities/customer.entity';

const CUSTOMERS = [
  { name: '张伟', email: 'zhangwei@example.com', locale: 'zh-CN', preferences: { preferredCurrency: 'CNY', notificationChannel: 'email' } },
  { name: 'Li Na', email: 'lina@example.com', locale: 'zh-CN', preferences: { preferredCurrency: 'USD', notificationChannel: 'sms' } },
  { name: 'James Chen', email: 'james.chen@example.com', locale: 'en-US', preferences: { preferredCurrency: 'USD', notificationChannel: 'email' } },
  { name: 'Emily Wang', email: 'emily.w@example.com', locale: 'en-US', preferences: { preferredCurrency: 'USD', notificationChannel: 'email' } },
  { name: '王芳', email: 'wangfang@example.com', locale: 'zh-CN', preferences: { preferredCurrency: 'CNY', notificationChannel: 'wechat' } },
  { name: '刘洋', email: 'liuyang@example.com', locale: 'zh-CN', preferences: { preferredCurrency: 'CNY', notificationChannel: 'email' } },
  { name: '田中太郎', email: 'tanaka@example.jp', locale: 'ja-JP', preferences: { preferredCurrency: 'JPY', notificationChannel: 'email' } },
  { name: 'Sakura Yamamoto', email: 'sakura@example.jp', locale: 'ja-JP', preferences: { preferredCurrency: 'JPY', notificationChannel: 'sms' } },
  { name: 'Michael Smith', email: 'michael.s@example.com', locale: 'en-US', preferences: { preferredCurrency: 'USD', notificationChannel: 'email' } },
  { name: 'Sarah Johnson', email: 'sarah.j@example.com', locale: 'en-US', preferences: { preferredCurrency: 'USD', notificationChannel: 'email' } },
  { name: 'Hans Mueller', email: 'hans.m@example.de', locale: 'de-DE', preferences: { preferredCurrency: 'EUR', notificationChannel: 'email' } },
  { name: 'Anna Schmidt', email: 'anna.s@example.de', locale: 'de-DE', preferences: { preferredCurrency: 'EUR', notificationChannel: 'sms' } },
  { name: '陈明', email: 'chenming@example.com', locale: 'zh-CN', preferences: { preferredCurrency: 'CNY', notificationChannel: 'wechat' } },
  { name: '赵丽', email: 'zhaoli@example.com', locale: 'zh-CN', preferences: { preferredCurrency: 'CNY', notificationChannel: 'email' } },
  { name: 'Pierre Dupont', email: 'pierre.d@example.fr', locale: 'fr-FR', preferences: { preferredCurrency: 'EUR', notificationChannel: 'email' } },
  { name: 'Marie Laurent', email: 'marie.l@example.fr', locale: 'fr-FR', preferences: { preferredCurrency: 'EUR', notificationChannel: 'sms' } },
  { name: 'David Lee', email: 'david.lee@example.com', locale: 'en-US', preferences: { preferredCurrency: 'USD', notificationChannel: 'email' } },
  { name: '佐藤健', email: 'sato@example.jp', locale: 'ja-JP', preferences: { preferredCurrency: 'JPY', notificationChannel: 'email' } },
  { name: '黄晓明', email: 'huangxm@example.com', locale: 'zh-CN', preferences: { preferredCurrency: 'CNY', notificationChannel: 'sms' } },
  { name: '周杰', email: 'zhoujie@example.com', locale: 'zh-CN', preferences: { preferredCurrency: 'CNY', notificationChannel: 'email' } },
];

@Injectable()
export class CustomerGenerator {
  private readonly logger = new Logger(CustomerGenerator.name);

  constructor(@InjectRepository(Customer) private readonly repo: Repository<Customer>) {}

  async generate(): Promise<number> {
    this.logger.log(`生成 ${CUSTOMERS.length} 个客户...`);
    let count = 0;
    for (const c of CUSTOMERS) {
      try {
        const customer = this.repo.create({
          name: c.name,
          email: c.email,
          locale: c.locale,
          preferences: c.preferences,
        });
        await this.repo.save(customer);
        count++;
      } catch (e) {
        this.logger.warn(`跳过客户 ${c.name}: ${(e as Error).message}`);
      }
    }
    return count;
  }
}
