import { AfterViewInit, Component, ViewChild, effect, input, output } from '@angular/core';
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import {
  CalendarOptions,
  DatesSetArg,
  EventClickArg,
  EventContentArg,
  EventInput,
} from '@fullcalendar/core';
import frLocale from '@fullcalendar/core/locales/fr';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import { BadgeModule } from 'primeng/badge';
import { Order } from '@merlebleu/shared';
import { ORDER_STATUSES, getOrderStatusColor } from '@shared/utils/order';

@Component({
  selector: 'order-calendar-view',
  imports: [FullCalendarModule, BadgeModule],
  templateUrl: './order-calendar-view.html',
  styleUrl: './order-calendar-view.scss',
})
export class OrderCalendarView implements AfterViewInit {
  @ViewChild('calendar') private calendarComponent?: FullCalendarComponent;

  orders = input<Order[]>([]);
  loading = input(false);

  protected readonly statuses = ORDER_STATUSES;

  rangeChange = output<{ from: string; to: string }>();
  eventClick = output<Order>();

  protected calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin],
    initialView: 'dayGridMonth',
    locale: frLocale,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridDay',
    },
    buttonText: {
      today: "Aujourd'hui",
      month: 'Mois',
      day: 'Jour',
    },
    slotMinTime: '07:00:00',
    slotMaxTime: '18:00:00',
    height: 'auto',
    eventClassNames: (arg: EventContentArg) => this.getEventClassNames(arg.event.id),
    eventClick: (arg: EventClickArg) => this.onEventClick(arg),
    datesSet: (arg: DatesSetArg) => this.onDatesSet(arg),
  };

  constructor() {
    effect(() => {
      this.syncEvents(this.orders());
    });
  }

  ngAfterViewInit(): void {
    this.syncEvents(this.orders());
  }

  private syncEvents(orders: Order[]): void {
    const api = this.calendarComponent?.getApi();
    if (!api) {
      return;
    }

    api.removeAllEvents();
    api.addEventSource(this.mapOrdersToEvents(orders));
  }

  private mapOrdersToEvents(orders: Order[]): EventInput[] {
    return orders.map((order) => {
      const hasDistinctEndTime =
        !!order.deliveryEndTime && order.deliveryEndTime !== order.deliveryStartTime;

      return {
        id: order.id,
        title: order.customerName,
        start: `${order.deliveryDate}T${order.deliveryStartTime}`,
        end: hasDistinctEndTime ? `${order.deliveryDate}T${order.deliveryEndTime}` : undefined,
        allDay: false,
      };
    });
  }

  private getEventClassNames(orderId: string): string[] {
    const order = this.orders().find((o) => o.id === orderId);
    return [`order-status-${getOrderStatusColor(order?.orderStatus)}`];
  }

  protected onEventClick(arg: EventClickArg): void {
    const order = this.orders().find((o) => o.id === arg.event.id);
    if (order) {
      this.eventClick.emit(order);
    }
  }

  protected onDatesSet(arg: DatesSetArg): void {
    this.rangeChange.emit({ from: arg.startStr, to: arg.endStr });
  }
}
