import type { RequestContext } from './request-context.interface';

/**
 * Base of every controller: the step between a `defineRoute` handler and the services. A controller method receives
 * the contract's validated input, calls services and maps the result to the contract response. It never touches the
 * database. Route usage: `defineRoute(Api.x, (input, ctx) => new XController(ctx).x(input))`.
 */
export abstract class BaseController {
  constructor(protected readonly ctx: RequestContext) {}

  /** A service of this request (same context). */
  protected service<S>(Service: new (ctx: RequestContext) => S): S {
    return new Service(this.ctx);
  }
}
