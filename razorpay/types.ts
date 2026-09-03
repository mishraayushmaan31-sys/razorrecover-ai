export type RazorpayOrderRequest = {
  amount: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
};

export type RazorpayOrder = {
  id: string;
  entity: 'order';
  amount: number;
  currency: string;
  status: 'created' | 'attempted' | 'paid';
  receipt: string;
};

export type RazorpayPayment = {
  id: string;
  entity: 'payment';
  amount: number;
  currency: string;
  status: string;
  order_id?: string;
  method?: string;
};

export type RazorpayPaymentLinkRequest = {
  amount: number;
  currency: string;
  description: string;
  customer?: { name?: string; email?: string; contact?: string };
  reference_id?: string;
};

export type RazorpayPaymentLink = {
  id: string;
  short_url: string;
  status: string;
  amount: number;
  currency: string;
};

export type RazorpayTransport = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
