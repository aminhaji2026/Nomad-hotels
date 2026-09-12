import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  SendNotificationDto,
  UpsertTemplateDto,
} from './dto/notifications.dto';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private render(template: string, variables?: Record<string, string>) {
    if (!variables) return template;
    return template.replace(
      /\{\{(\w+)\}\}/g,
      (_, key: string) => variables[key] ?? '',
    );
  }

  async send(user: AuthUser | null, dto: SendNotificationDto) {
    let subject = dto.subject;
    let body = dto.body ?? '';
    if (dto.templateCode) {
      const tpl = await this.prisma.notificationTemplate.findFirst({
        where: { code: dto.templateCode, channel: dto.channel },
      });
      if (!tpl) throw new NotFoundException('Template not found');
      subject = subject ?? this.render(tpl.subject ?? '', dto.variables);
      body = this.render(tpl.body, dto.variables);
    }
    const notification = await this.prisma.notification.create({
      data: {
        userId: dto.userId,
        channel: dto.channel,
        template: dto.templateCode,
        subject,
        body,
        status: 'QUEUED',
      },
    });
    // Sandbox delivery: mark sent immediately
    const sent = await this.prisma.notification.update({
      where: { id: notification.id },
      data: { status: 'SENT', sentAt: new Date() },
    });
    if (user) {
      await this.audit.log({
        actorId: user.id,
        action: 'notification.send',
        resource: 'Notification',
        resourceId: sent.id,
        metadata: { channel: dto.channel, template: dto.templateCode },
      });
    }
    return sent;
  }

  async myNotifications(user: AuthUser) {
    return this.prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async upsertTemplate(user: AuthUser, dto: UpsertTemplateDto) {
    const locale = (dto.locale as any) ?? 'en';
    const tpl = await this.prisma.notificationTemplate.upsert({
      where: {
        code_channel_locale: {
          code: dto.code,
          channel: dto.channel,
          locale,
        },
      },
      update: { subject: dto.subject, body: dto.body },
      create: {
        code: dto.code,
        channel: dto.channel,
        locale,
        subject: dto.subject,
        body: dto.body,
      },
    });
    await this.audit.log({
      actorId: user.id,
      action: 'notification.template_upsert',
      resource: 'NotificationTemplate',
      resourceId: tpl.id,
    });
    return tpl;
  }

  async listTemplates() {
    return this.prisma.notificationTemplate.findMany({
      orderBy: { code: 'asc' },
    });
  }
}
