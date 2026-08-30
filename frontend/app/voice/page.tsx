"use client";

import { useRef, useState } from "react";

export default function VoicePage() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });

        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);

        stream.getTracks().forEach((track) => track.stop());
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

          <a
            href="/"
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
              className={`mx-auto mt-10 flex h-28 w-28 items-center justify-center rounded-full text-4xl shadow-lg transition ${
                isRecording
                  ? "scale-105 bg-[#20231f] text-white"
                  : "bg-[#4f6f52] text-white hover:scale-105"
              }`}
            >
              {isRecording ? "■" : "🎙️"}
            </button>

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

            {/* Example */}
            <div className="mx-auto mt-10 max-w-xl rounded-2xl bg-[#f7f6f2] p-5 text-left">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Example
              </p>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                “Rima ordered two printed kurtis for 1,250 taka each. Delivery
                address is Mirpur.”
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