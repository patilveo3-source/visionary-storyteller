/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Send, 
  Loader2, 
  Image as ImageIcon, 
  Video, 
  FileText, 
  RefreshCw,
  ChevronRight,
  Play,
  Pause,
  Volume2,
  Key
} from 'lucide-react';
import { cn } from './lib/utils';
import { generateStory, generateImage, StoryData } from './services/gemini';
import ReactMarkdown from 'react-markdown';

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export default function App() {
  const [topic, setTopic] = useState('');
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16">("16:9");
  const [isGenerating, setIsGenerating] = useState(false);
  const [storyData, setStoryData] = useState<StoryData | null>(null);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [generatedImages, setGeneratedImages] = useState<Record<number, string>>({});
  const [status, setStatus] = useState<string>('');

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || isGenerating) return;

    setIsGenerating(true);
    setStatus('Crafting your story script...');
    setStoryData(null);
    setGeneratedImages({});
    setCurrentSceneIndex(0);

    try {
      const data = await generateStory(topic, aspectRatio);
      setStoryData(data);
      setStatus('Script generated. Ready to visualize.');
    } catch (error) {
      console.error(error);
      setStatus('Failed to generate story. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleVisualizeScene = async (index: number) => {
    if (!storyData) return;
    const scene = storyData.scenes[index];
    
    setIsGenerating(true);
    try {
      setStatus(`Generating image for scene ${index + 1}...`);
      const img = await generateImage(
        `Vector whiteboard style art, ${scene.imagePrompt}. ${storyData.characterDescription}`,
        aspectRatio
      );
      setGeneratedImages(prev => ({ ...prev, [index]: img }));
      
      setStatus(`Scene ${index + 1} image complete!`);
    } catch (error) {
      console.error(error);
      setStatus(`Failed to visualize scene ${index + 1}.`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-black" />
            </div>
            <span className="font-semibold tracking-tight text-lg">Visionary Storyteller</span>
          </div>
          <div className="flex items-center gap-4">
            {status && (
              <span className="text-xs text-white/40 font-mono animate-pulse">
                {status}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Column: Input & Script */}
          <div className="lg:col-span-5 space-y-8">
            <section className="space-y-6">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-widest text-white/40 mb-4">The Spark</h2>
                <form onSubmit={handleGenerate} className="relative group">
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Enter a story topic..."
                    className="w-full bg-[#111] border border-white/10 rounded-2xl py-5 px-6 pr-16 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-white/20"
                  />
                  <button
                    type="submit"
                    disabled={isGenerating || !topic.trim()}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-black hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isGenerating && !storyData ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
                </form>
              </div>

              <div>
                <h2 className="text-sm font-semibold uppercase tracking-widest text-white/40 mb-4">Aspect Ratio</h2>
                <div className="flex gap-4">
                  {(["16:9", "9:16"] as const).map((ratio) => (
                    <button
                      key={ratio}
                      type="button"
                      onClick={() => setAspectRatio(ratio)}
                      className={cn(
                        "flex-1 py-3 rounded-xl border transition-all flex items-center justify-center gap-2",
                        aspectRatio === ratio
                          ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                          : "bg-[#111] border-white/5 text-white/40 hover:border-white/10"
                      )}
                    >
                      <div className={cn(
                        "border-2 rounded-sm",
                        ratio === "16:9" ? "w-6 h-4" : "w-4 h-6",
                        aspectRatio === ratio ? "border-emerald-400" : "border-white/20"
                      )} />
                      <span className="text-sm font-medium">{ratio}</span>
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <AnimatePresence mode="wait">
              {storyData && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-sm font-semibold uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2">
                      <FileText className="w-4 h-4" /> The Narrative
                    </h2>
                    <div className="bg-[#111] border border-white/10 rounded-3xl p-6 max-h-[400px] overflow-y-auto custom-scrollbar">
                      <div className="prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown>{storyData.script}</ReactMarkdown>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-sm font-semibold uppercase tracking-widest text-white/40 mb-4">Character Profile</h2>
                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 text-sm text-emerald-100/80 italic">
                      {storyData.characterDescription}
                    </div>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>
          </div>

          {/* Right Column: Visualization */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              {!storyData ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full min-h-[500px] border border-dashed border-white/10 rounded-[40px] flex flex-col items-center justify-center text-center p-12"
                >
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                    <ImageIcon className="w-10 h-10 text-white/20" />
                  </div>
                  <h3 className="text-xl font-medium mb-2 text-white/60">Ready to Visualize</h3>
                  <p className="text-white/30 max-w-xs">Enter a topic to generate a script and start creating your cinematic story.</p>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-8"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold uppercase tracking-widest text-white/40">Storyboard</h2>
                    <div className="flex gap-2">
                      {storyData.scenes.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentSceneIndex(idx)}
                          className={cn(
                            "w-8 h-8 rounded-lg text-xs font-mono transition-all",
                            currentSceneIndex === idx 
                              ? "bg-emerald-500 text-black font-bold" 
                              : "bg-white/5 text-white/40 hover:bg-white/10"
                          )}
                        >
                          {idx + 1}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Current Scene Display */}
                  <div className="space-y-6">
                    <div className={cn(
                      "relative bg-[#111] rounded-[32px] overflow-hidden border border-white/10 group mx-auto",
                      aspectRatio === "16:9" ? "aspect-video w-full" : "aspect-[9/16] w-[300px]"
                    )}>
                      {generatedImages[currentSceneIndex] ? (
                        <img 
                          src={generatedImages[currentSceneIndex]} 
                          alt={`Scene ${currentSceneIndex + 1}`}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                            <ImageIcon className="w-8 h-8 text-white/20" />
                          </div>
                          <p className="text-white/40 text-sm">No image generated for this scene yet.</p>
                        </div>
                      )}

                      {/* Overlay Controls */}
                      <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-3">
                          <span className="text-xs font-mono text-emerald-400">{storyData.scenes[currentSceneIndex].timestamp}</span>
                          <div className="w-px h-3 bg-white/20" />
                          <p className="text-xs text-white/80 line-clamp-1 max-w-[200px]">
                            {storyData.scenes[currentSceneIndex].narration}
                          </p>
                        </div>
                        
                        {!generatedImages[currentSceneIndex] && !isGenerating && (
                          <button
                            onClick={() => handleVisualizeScene(currentSceneIndex)}
                            className="bg-emerald-500 hover:bg-emerald-400 text-black px-6 py-2 rounded-full text-sm font-semibold flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                          >
                            <RefreshCw className="w-4 h-4" /> Generate Image
                          </button>
                        )}
                      </div>

                      {isGenerating && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
                          <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
                          <p className="text-sm font-medium text-white/80">{status}</p>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[#111] border border-white/10 rounded-2xl p-5">
                        <h4 className="text-[10px] uppercase tracking-widest text-white/30 mb-2 flex items-center gap-1.5">
                          <ImageIcon className="w-3 h-3" /> Image Prompt
                        </h4>
                        <p className="text-xs text-white/60 leading-relaxed italic">
                          {storyData.scenes[currentSceneIndex].imagePrompt}
                        </p>
                      </div>
                      <div className="bg-[#111] border border-white/10 rounded-2xl p-5">
                        <h4 className="text-[10px] uppercase tracking-widest text-white/30 mb-2 flex items-center gap-1.5">
                          <Video className="w-3 h-3" /> Video Prompt
                        </h4>
                        <p className="text-xs text-white/60 leading-relaxed italic">
                          {storyData.scenes[currentSceneIndex].videoPrompt}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <button 
                        disabled={currentSceneIndex === 0}
                        onClick={() => setCurrentSceneIndex(prev => prev - 1)}
                        className="text-sm text-white/40 hover:text-white disabled:opacity-20 transition-colors flex items-center gap-1"
                      >
                        Previous Scene
                      </button>
                      <button 
                        disabled={currentSceneIndex === storyData.scenes.length - 1}
                        onClick={() => setCurrentSceneIndex(prev => prev + 1)}
                        className="text-sm text-emerald-500 hover:text-emerald-400 disabled:opacity-20 transition-colors flex items-center gap-1"
                      >
                        Next Scene <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
