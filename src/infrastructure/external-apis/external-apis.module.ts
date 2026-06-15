import { Module } from '@nestjs/common';
import { MockPlatformAdapter } from './mock-adapter';

@Module({
  providers: [
    { provide: 'IPlatformAdapter', useClass: MockPlatformAdapter },
  ],
  exports: ['IPlatformAdapter'],
})
export class ExternalApisModule {}
