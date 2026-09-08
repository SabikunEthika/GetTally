"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ChatPage() {
    const router = useRouter();
    const [chatText, setChatText] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [extractedOrder, setExtractedOrder] = useState<any>(null);

    const sampleChat = `Customer: Hi, do you have any printed kurtis?
You: Yes, we have beautiful printed kurtis available
Customer: Great! I want 3 kurtis for 1500 taka each
Customer: Can you deliver to Gulshan?
You: Sure, we deliver to Gulshan
Customer: Perfect! I'll take them`;

    const analyzeChat = async () => {
        if (!chatText.trim()) {
            alert("Please paste a chat or use the sample");
            return;
        }

        setIsAnalyzing(true);

        try {
            const response = await fetch('http://localhost:3001/api/orders/extract', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    transcript: chatText,
                    sellerId: '2'
                }),
            });

            const data = await response.json();
            console.log('Extract response:', data);

            if (data.success) {
                setExtractedOrder(data.data);
            } else {
                alert('Could not extract order from chat');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error analyzing chat');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const confirmOrder = async (orderData: any) => {
        try {
            const response = await fetch('http://localhost:3001/api/orders/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderData,
                    sellerId: '2'
                }),
            });

            const data = await response.json();

            if (data.success) {
                alert(`✅ Order saved! ID: ${data.orderId}`);
                setExtractedOrder(null);
                setChatText('');
            }
        } catch (error) {
            console.error('Confirm error:', error);
            alert('Error confirming order');
        }
    };

    return (
        <main className="min-h-screen bg-[#f7f6f2] text-[#20231f]">
            <div className="mx-auto max-w-4xl px-6 py-8 lg:px-10">

                {/* Header */}
                <header className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Get<span className="text-[#4f6f52]">Tally</span>
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Chat Order Logger
                        </p>
                    </div>


                    <a href="/"
                        className="rounded-full border border-gray-200 bg-white px-5 py-3 text-sm font-semibold transition hover:bg-gray-100"
                    >
                        ← Dashboard
                    </a>
                </header>

                {/* Main */}
                <section className="mt-10 space-y-6">

                    {/* Input */}
                    <div className="rounded-2xl bg-white p-6 shadow-sm">
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                            📋 Paste Messenger Chat
                        </p>

                        <textarea
                            value={chatText}
                            onChange={(e) => setChatText(e.target.value)}
                            placeholder="Paste your Messenger conversation here..."
                            className="h-40 w-full rounded-xl border border-gray-200 p-4 text-sm focus:border-[#4f6f52] focus:outline-none"
                        />

                        <div className="mt-4 flex gap-3">
                            <button
                                onClick={analyzeChat}
                                disabled={isAnalyzing}
                                className="flex-1 rounded-2xl bg-[#4f6f52] px-5 py-3 font-semibold text-white transition disabled:opacity-50 hover:bg-[#20231f]"
                            >
                                {isAnalyzing ? '⏳ Analyzing...' : '🔍 Analyze Chat'}
                            </button>

                            <button
                                onClick={() => setChatText(sampleChat)}
                                className="flex-1 rounded-2xl border-2 border-[#4f6f52] px-5 py-3 font-semibold text-[#4f6f52] transition hover:bg-[#f7f6f2]"
                            >
                                📌 Use Sample
                            </button>
                        </div>
                    </div>

                    {/* Extracted Order */}
                    {extractedOrder && (
                        <div className="mx-auto mt-8 max-w-xl rounded-2xl bg-white p-6 shadow-md border-2 border-[#4f6f52]">
                            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-[#4f6f52]">
                                📋 Order Confirmation - Review & Edit
                            </p>

                            <div className="space-y-4 text-left">
                                <div>
                                    <label className="text-xs text-gray-500">Customer Name</label>
                                    <input
                                        type="text"
                                        value={extractedOrder.customerName || ''}
                                        onChange={(e) =>
                                            setExtractedOrder({
                                                ...extractedOrder,
                                                customerName: e.target.value,
                                            })
                                        }
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-lg font-semibold focus:border-[#4f6f52] focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs text-gray-500">Product</label>
                                    <input
                                        type="text"
                                        value={extractedOrder.product || ''}
                                        onChange={(e) =>
                                            setExtractedOrder({
                                                ...extractedOrder,
                                                product: e.target.value,
                                            })
                                        }
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-lg font-semibold focus:border-[#4f6f52] focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs text-gray-500">Quantity</label>
                                    <input
                                        type="number"
                                        value={extractedOrder.quantity || 0}
                                        onChange={(e) =>
                                            setExtractedOrder({
                                                ...extractedOrder,
                                                quantity: parseInt(e.target.value) || 0,
                                            })
                                        }
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-lg font-semibold focus:border-[#4f6f52] focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs text-gray-500">Unit Price (৳)</label>
                                    <input
                                        type="number"
                                        value={extractedOrder.unitPrice || 0}
                                        onChange={(e) =>
                                            setExtractedOrder({
                                                ...extractedOrder,
                                                unitPrice: parseInt(e.target.value) || 0,
                                            })
                                        }
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-lg font-semibold focus:border-[#4f6f52] focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs text-gray-500">Delivery Address</label>
                                    <input
                                        type="text"
                                        value={extractedOrder.deliveryAddress || ''}
                                        onChange={(e) =>
                                            setExtractedOrder({
                                                ...extractedOrder,
                                                deliveryAddress: e.target.value,
                                            })
                                        }
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-lg font-semibold focus:border-[#4f6f52] focus:outline-none"
                                    />
                                </div>

                                <div className="rounded-lg bg-[#f7f6f2] p-3 mt-4">
                                    <p className="text-sm text-gray-600">
                                        <strong>Total:</strong> ৳{(extractedOrder.quantity || 0) * (extractedOrder.unitPrice || 0)}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 flex gap-3">
                                <button
                                    onClick={() => confirmOrder(extractedOrder)}
                                    className="flex-1 rounded-2xl bg-[#4f6f52] px-4 py-3 font-semibold text-white transition hover:bg-[#20231f]"
                                >
                                    ✅ Confirm Order
                                </button>
                                <button
                                    onClick={() => setExtractedOrder(null)}
                                    className="flex-1 rounded-2xl border-2 border-[#4f6f52] px-4 py-3 font-semibold text-[#4f6f52] transition hover:bg-[#f7f6f2]"
                                >
                                    ❌ Reject
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Info */}
                    <div className="rounded-2xl bg-[#eef3eb] p-6 border-l-4 border-[#4f6f52]">
                        <p className="font-semibold text-[#4f6f52]">💡 How it works</p>
                        <p className="mt-2 text-sm text-gray-600">
                            Paste any Messenger conversation. GetTally's AI will analyze it, detect if an order was placed, and extract the details automatically. Review and confirm before saving.
                        </p>
                    </div>

                </section>

            </div>
        </main>
    );
}