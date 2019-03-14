
export enum LogLevel {
  trace = 0,
  debug = 3,
  info = 5,
  warn = 7,
  error = 10
}

export interface Logger {
  /**
   * Trace level logging. The most detailed level of logging.
   * 
   * @param message to log.
   * @param context to log.
   * @param condition, that when true, will result in this statement being printed. Default is true.
   */
  trace(message: string, context?: any, condition?: boolean): void;

  /**
   * Debug level logging. Detailed but relavent.
   * 
   * @param message to log.
   * @param context to log.
   * @param condition, that when true, will result in this statement being printed. Default is true.
   */
  debug(message: string, context?: any, condition?: boolean): void;

  /**
   * Info level logging. Helpful messages or contextual information.
   * 
   * @param message to log.
   * @param context to log.
   * @param condition, that when true, will result in this statement being printed. Default is true.
   */
  info(message: string, context?: any, condition?: boolean): void;

  /**
   * Warn level logging. Something is wrong, but things are not 'broken'.
   * 
   * @param message to log.
   * @param context to log.
   * @param condition, that when true, will result in this statement being printed. Default is true.
   */
  warn(message: string, context?: any, condition?: boolean): void;

  /**
   * Error level logging. Its broken, and the cat is on fire!
   * 
   * @param message to log.
   * @param context to log.
   * @param condition, that when true, will result in this statement being printed. Default is true.
   */
  error(message: string, context?: any, condition?: boolean): void;

  /**
   * Starts a timer with the label provided, or a default if no label was provided.
   * 
   * @param label of the timer.
   */
  startTimer(label?: string): void;

  /**
   * Prints out the elapsed time of the label provided, or a default if no label was provided. 
   * 
   * Requires that startTimer be executed first.
   * 
   * @param label of the timer.
   */
  endTimer(label?: string): void;

  /**
   * Resets a timer back to undefined.
   * 
   * @param label of the timer.
   */
  resetTimer(label?: string): void;

  /**
   * Outputs memory information to the console.
   */
  memory(): void;

  /**
   * Prints out a child logger, with the same settings as this logger. However,
   * the messages will be grouped by the name provided.
   * 
   * @param name of the child logger.
   */
  child(name: string): Logger;

}