import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SaleModule } from './features/sale/sale.module';
import { IdentityModule } from './features/identity/identity.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'mickael',
      password: 'motdepasse',
      database: 'merlebleu',
      entities: [],
      synchronize: true, // Note: Set to false in production,
      autoLoadEntities: true,
    }),
    SaleModule,
    IdentityModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
