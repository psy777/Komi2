import Link from "next/link";
import React from "react";

export default function LandingPage() {
    return (
        <div className="min-h-[100dvh] bg-slate-950 text-slate-100 font-sans flex flex-col justify-center relative overflow-hidden">
            {/* Background glowing effects */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[50%] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[50%] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none" />

            <main className="flex flex-col items-center justify-center text-center px-6 z-10 w-full max-w-4xl mx-auto space-y-8">

                {/* Hero Title */}
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-slate-100 via-slate-300 to-slate-500 pb-4">
                    More pointers for your game
                </h1>

                {/* Hero Tagline */}
                <p className="text-lg md:text-2xl text-slate-400 max-w-2xl leading-relaxed font-medium p-4">
                    Turn AI analysis into actionable insights with our advanced reviewing and study tools.
                </p>

                {/* Call To Action */}
                <div className="pt-8">
                    <Link
                        href="/play"
                        className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-300 bg-blue-600 rounded-2xl hover:bg-blue-500 hover:-translate-y-1 hover:shadow-[0_0_40px_-5px_rgba(37,99,235,0.5)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 focus:ring-offset-slate-950 overflow-hidden"
                    >
                        <span className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></span>
                        <span className="relative mr-3 text-lg">Play Now</span>
                        <svg className="relative w-6 h-6 transition-transform duration-300 group-hover:translate-x-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </Link>
                </div>
            </main>
        </div>
    );
}
