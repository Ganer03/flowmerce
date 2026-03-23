import { PassThrough } from "stream";
import Handlebars from "handlebars";
import { writeWithDrain } from "@flowmerce/shared";

export interface HandlebarsStreamWriterOptions {
  enableValidation?: boolean; // Включить валидацию состояния
}

export class HandlebarsStreamWriter {
  private headerTemplate?: Handlebars.TemplateDelegate;
  private bodyTemplate?: Handlebars.TemplateDelegate;
  private footerTemplate?: Handlebars.TemplateDelegate;
  private stream?: PassThrough;
  private writer?: (data: string) => Promise<void>;
  private isFirstData = true;
  private hasHeader = false;
  private hasFooter = false;
  private isCommitted = false;
  private enableValidation: boolean;

  constructor(options: HandlebarsStreamWriterOptions = {}) {
    this.enableValidation =
      options.enableValidation !== undefined ? options.enableValidation : true; // по умолчанию включено
  }

  /**
   * Устанавливает шаблон для заголовка
   * @param template - шаблон Handlebars для заголовка
   */
  setHeader(template: string): void {
    this.headerTemplate = Handlebars.compile(template);
  }

  /**
   * Устанавливает шаблон для тела данных
   * @param template - шаблон Handlebars для тела
   */
  setBody(template: string): void {
    this.bodyTemplate = Handlebars.compile(template);
  }

  /**
   * Устанавливает шаблон для футера
   * @param template - шаблон Handlebars для футера
   */
  setFooter(template: string): void {
    this.footerTemplate = Handlebars.compile(template);
  }

  /**
   * Регистрирует хелпер для Handlebars
   * @param name - имя хелпера
   * @param helper - функция хелпера
   */
  registerHelper(name: string, helper: Handlebars.HelperDelegate): void {
    Handlebars.registerHelper(name, helper);
  }

  /**
   * Создает и возвращает поток для записи данных
   * @param data - данные для рендеринга заголовка
   * @returns PassThrough поток
   */
  createStream(data: Record<string, any> = {}): PassThrough {
    if (this.stream) {
      throw new Error(
        "Stream уже создан. Используйте один экземпляр для одного потока.",
      );
    }

    this.stream = new PassThrough();
    this.writer = writeWithDrain(this.stream);
    this.isFirstData = true;
    this.hasHeader = false;
    this.hasFooter = false;
    this.isCommitted = false;

    // Записываем заголовок сразу при создании потока
    if (this.headerTemplate) {
      const header = this.headerTemplate(data);
      this.hasHeader = true;
      this.stream.write(header);
    } else if (this.enableValidation) {
      throw new Error(
        "Шаблон заголовка не установлен. Вызовите setHeader() перед createStream()",
      );
    }

    return this.stream;
  }

  /**
   * Асинхронно записывает данные в поток используя шаблон тела
   * @param data - данные для рендеринга
   */
  async putData(data: Record<string, any>): Promise<void> {
    this.validateState("putData");

    if (!this.bodyTemplate) {
      throw new Error("Шаблон тела не установлен. Сначала вызовите setBody()");
    }

    if (!this.writer) {
      throw new Error("Stream не создан. Сначала вызовите createStream()");
    }

    // Добавляем флаги для шаблона
    const dataWithFlags = {
      ...data,
      isFirstProduct: this.isFirstData,
      isLastProduct: false, // мы не знаем, последний ли это элемент
    };

    const body = this.bodyTemplate(dataWithFlags);
    await this.writer(body);

    this.isFirstData = false;
  }

  /**
   * Асинхронно завершает поток, записывая футер
   * @param data - данные для рендеринга футера
   */
  async commit(data: Record<string, any> = {}): Promise<void> {
    this.validateState("commit");

    if (!this.writer) {
      throw new Error("Stream не создан. Сначала вызовите createStream()");
    }

    // Записываем футер если он есть
    if (this.footerTemplate) {
      const footer = this.footerTemplate(data);
      await this.writer(footer);
      this.hasFooter = true;
    } else if (this.enableValidation) {
      // Для JSON и других форматов футер может быть обязательным
      throw new Error(
        "Шаблон футера не установлен. Для корректного JSON вызовите setFooter()",
      );
    }

    this.isCommitted = true;
    this.stream?.end();
  }

  /**
   * Принудительно завершает поток без записи футера
   */
  async end(): Promise<void> {
    this.validateState("end");
    this.isCommitted = true;
    this.stream?.end();
  }

  /**
   * Валидирует состояние перед операциями
   */
  private validateState(operation: string): void {
    if (!this.enableValidation) return;

    switch (operation) {
      case "putData":
        if (!this.hasHeader && this.headerTemplate) {
          throw new Error(
            "Заголовок не был записан. Сначала вызовите createStream()",
          );
        }
        if (this.isCommitted) {
          throw new Error(
            "Stream уже завершен. Нельзя записывать данные после commit()",
          );
        }
        break;

      case "commit":
      case "end":
        if (this.isCommitted) {
          throw new Error("Stream уже завершен");
        }
        break;
    }
  }

  /**
   * Проверяет, был ли записан заголовок
   */
  public get hasHeaderWritten(): boolean {
    return this.hasHeader;
  }

  /**
   * Проверяет, был ли записан футер
   */
  public get hasFooterWritten(): boolean {
    return this.hasFooter;
  }

  /**
   * Проверяет, завершен ли поток
   */
  public get isFinished(): boolean {
    return this.isCommitted;
  }
}
