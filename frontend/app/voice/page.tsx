"use client";

import { useRef, useState } from "react";

export default function VoicePage() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedOrder, setExtractedOrder] = useState<any>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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
        setAudioURL(null);
      } else {
        alert('Error confirming order');
      }
    } catch (error) {
      console.error('Confirm error:', error);
      alert('Error confirming order');
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });

        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);

        stream.getTracks().forEach((track) => track.stop());

        setIsProcessing(true);

        try {
          const formData = new FormData();
          formData.append('audio', audioBlob);
          formData.append('sellerId', '2');

          // Step 1: Upload audio
          const uploadResponse = await fetch('http://localhost:3001/api/orders/voice/upload', {
            method: 'POST',
            body: formData,
          });

          const uploadData = await uploadResponse.json();
          console.log('Upload response:', uploadData);

          if (!uploadData.success) {
            alert('Error uploading audio');
            setIsProcessing(false);
            return;
          }

          const audioFilePath = uploadData.data.filepath;

          // Step 2: Transcribe audio
          const transcribeResponse = await fetch('http://localhost:3001/api/orders/voice/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audioFilePath }),
          });

          const transcribeData = await transcribeResponse.json();
          console.log('Transcribe response:', transcribeData);

          if (!transcribeData.success) {
            alert('Error transcribing audio');
            setIsProcessing(false);
            return;
          }

          const transcript = transcribeData.data.transcript;

          // Step 3: Extract order from transcript
          const extractResponse = await fetch('http://localhost:3001/api/orders/extract', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              transcript,
              sellerId: '2'
            }),
          });

          const extractData = await extractResponse.json();
          console.log('Extract response:', extractData);

          if (extractData.success) {
            setExtractedOrder(extractData.data);
          } else {
            alert('Error extracting order');
          }

        } catch (error) {
          console.error('Error:', error);
          alert('Error processing audio');
        } finally {
          setIsProcessing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Could not access microphone:", error);
      alert("Microphone access was denied or is unavailable.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f6f2] text-[#20231f]">
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col px-6 py-8 lg:px-10">

        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Get<span className="text-[#4f6f52]">Tally</span>
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Voice Order Logger
            </p>
          </div>


          <a href="/"
            className="rounded-full border border-gray-200 bg-white px-5 py-3 text-sm font-semibold transition hover:bg-gray-100"
          >
            ← Dashboard
          </a>
        </header>

        {/* Main Voice Card */}
        <section className="mt-10 flex flex-1 items-center justify-center">
          <div className="w-full rounded-[2rem] bg-white p-8 text-center shadow-sm sm:p-12">

            {/* Microphone Icon */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eef3eb] text-3xl">
              🎙️
            </div>

            {/* Status */}
            <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-[#4f6f52]">
              {isRecording ? "Listening..." : "Voice Order"}
            </p>

            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              {isRecording
                ? "Tell me what you sold."
                : "Log an order without typing."}
            </h2>

            <p className="mx-auto mt-4 max-w-lg leading-7 text-gray-500">
              Speak naturally. GetTally will turn your words into structured
              order information that you can review before saving.
            </p>

            {/* Recording Button */}
            <button
              onClick={handleRecording}
              className={`mx-auto mt-10 flex h-28 w-28 items-center justify-center rounded-full text-4xl shadow-lg transition ${isRecording
                ? "scale-105 bg-[#20231f] text-white"
                : "bg-[#4f6f52] text-white hover:scale-105"
                }`}
            >
              {isRecording ? "■" : "🎙️"}
            </button>

            {isProcessing && (
              <p className="mt-5 text-sm text-gray-500 animate-pulse">
                ⏳ Processing audio (transcribing & extracting order)...
              </p>
            )}

            <p className="mt-5 text-sm text-gray-400">
              {isRecording
                ? "Tap the button to stop"
                : "Tap the microphone to start"}
            </p>

            {/* Recorded Audio */}
            {audioURL && !isRecording && (
              <div className="mx-auto mt-8 max-w-xl rounded-2xl bg-[#f7f6f2] p-5">
                <p className="mb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Your recording
                </p>

                <audio
                  controls
                  src={audioURL}
                  className="w-full"
                />
              </div>
            )}

            {/* Extracted Order Confirmation */}
            {extractedOrder && (
              <div className="mx-auto mt-8 max-w-xl rounded-2xl bg-white p-6 shadow-md border-2 border-[#4f6f52]">
                <p className="mb-4 text-left text-xs font-semibold uppercase tracking-wider text-[#4f6f52]">
                  📋 Order Confirmation
                </p>

                <div className="space-y-4 text-left">
                  <div>
                    <label className="text-xs text-gray-500">Customer Name</label>
                    <p className="text-lg font-semibold">{extractedOrder.customerName || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Product</label>
                    <p className="text-lg font-semibold">{extractedOrder.product || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Quantity</label>
                    <p className="text-lg font-semibold">{extractedOrder.quantity || 0}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Unit Price</label>
                    <p className="text-lg font-semibold">৳{extractedOrder.unitPrice || 0}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Delivery Address</label>
                    <p className="text-lg font-semibold">{extractedOrder.deliveryAddress || 'N/A'}</p>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => confirmOrder(extractedOrder)}
                    className="flex-1 rounded-2xl bg-[#4f6f52] px-4 py-3 font-semibold text-white transition hover:bg-[#20231f]"
                  >
                    ✅ Confirm
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

            {/* Example */}
            <div className="mx-auto mt-10 max-w-xl rounded-2xl bg-[#f7f6f2] p-5 text-left">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Example
              </p>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                "Rima ordered two printed kurtis for 1,250 taka each. Delivery
                address is Mirpur."
              </p>
            </div>

            {/* Trust Message */}
            <div className="mx-auto mt-6 flex max-w-xl items-start gap-3 rounded-2xl border border-[#dfe8dc] bg-[#f8faf7] p-4 text-left">
              <span className="text-lg">✓</span>

              <p className="text-sm leading-6 text-gray-600">
                <strong className="text-[#20231f]">
                  Nothing is saved automatically.
                </strong>{" "}
                You&apos;ll review the extracted order details and confirm them
                before they are added to your records.
              </p>
            </div>

          </div>
        </section>
      </div>
    </main>
  );
}