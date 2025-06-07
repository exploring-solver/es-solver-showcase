import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const generateSignature = (
  razorpayOrderId: string,
  razorpayPaymentId: string
) => {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    throw new Error(
      'Razorpay key secret is not defined in environment variables.'
    );
  }
  const sig = crypto
    .createHmac('sha256', keySecret)
    .update(razorpayOrderId + '|' + razorpayPaymentId)
    .digest('hex');
  return sig;
};

export async function POST(request: NextRequest) {
  try {
    const { orderCreationId, razorpayPaymentId, razorpayOrderId, razorpaySignature } =
      await request.json();
    
    // Verify the payment signature
    const signature = generateSignature(orderCreationId, razorpayPaymentId);
    
    if (signature !== razorpaySignature) {
      return NextResponse.json(
        { message: 'Payment verification failed', isOk: false },
        { status: 400 }
      );
    }
    
    // Update order status to PAID in your database
    // Note: You might want to add this code based on your database schema
    
    return NextResponse.json(
      { message: 'Payment verified successfully', isOk: true },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { message: 'Internal server error', isOk: false },
      { status: 500 }
    );
  }
}