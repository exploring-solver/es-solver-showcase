'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CheckoutComponent() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  
  const handleCheckout = async () => {
    setLoading(true);
    
    try {
      // Call the API to create an order and get the Razorpay order details
      const response = await fetch('/api/checkout', {
        method: 'POST',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create order');
      }
      
      const data = await response.json();
      
      // Initialize Razorpay payment
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency,
        name: 'Your Store Name',
        description: 'Purchase from Your Store',
        order_id: data.id,
        handler: async function (response: any) {
          try {
            // Verify the payment signature
            const verifyResponse = await fetch('/api/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderCreationId: data.id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });
            
            const verifyData = await verifyResponse.json();
            
            if (verifyData.isOk) {
              // Clear cart in database (already done in the checkout API)
              
              // Redirect to success page
              router.push(`/module/ecommerce/checkout/success?orderId=${data.orderId}`);
            } else {
              alert('Payment verification failed: ' + verifyData.message);
              setLoading(false);
            }
          } catch (error) {
            console.error('Verification error:', error);
            setLoading(false);
          }
        },
        prefill: {
          name: '', // You can prefill with user data if available
          email: '',
          contact: '',
        },
        notes: {
          address: 'Your Store Address'
        },
        theme: {
          color: '#3399cc',
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
          }
        }
      };
      
      const paymentObject = new window.Razorpay(options);
      
      paymentObject.on('payment.failed', function (response: any) {
        alert(response.error.description);
        setLoading(false);
      });
      
      paymentObject.open();
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to proceed with checkout. Please try again.');
      setLoading(false);
    }
  };

  return (
    <>
      <Script
        id="razorpay-checkout-js"
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setScriptLoaded(true)}
      />
      
      <Button 
        onClick={handleCheckout} 
        disabled={loading || !scriptLoaded}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          'Proceed to Payment'
        )}
      </Button>
    </>
  );
}