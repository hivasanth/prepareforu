import re

filepath = r"c:\Users\Vasanth\Desktop\PrepareForU\src\pages\sub-admin\SubAdminCreate.tsx"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace step 1 grid
step1_pattern = re.compile(
    r'(<div className={`grid gap-4 \${breakpoint === \'xs\' \? \'grid-cols-1\' : \'grid-cols-3\'}`}>\s*\{\[\s*\{ id: \'image\', icon: ImageIcon, label: \'Image / Photos\', sub: \'Diagrams & Screenshots\', color: \'from-violet-500/10 to-purple-500/5\' \},\s*\{ id: \'pdf\',\s*icon: FileIcon,\s*label: \'PDF Document\',\s*sub: \'Notes & Syllabus\',\s*color: \'from-blue-500/10 to-cyan-500/5\' \},\s*\{ id: \'text\',\s*icon: FileText,\s*label: \'Raw Text\',\s*sub: \'Direct Content Paste\',\s*color: \'from-emerald-500/10 to-teal-500/5\' \}\s*\]\.map\(opt => \{)([\s\S]*?)(</motion\.div>\s*\)\s*\}\)}\s*</div>)',
    re.MULTILINE
)

new_step1_grid = """<div className={`grid gap-4 ${breakpoint === 'xs' ? 'grid-cols-1' : 'grid-cols-2'} max-w-2xl mx-auto`}>
                  {[
                    { id: 'notebooklm', icon: FileText, label: 'NotebookLM', sub: 'Best for specific PDFs/Docs', color: 'from-blue-500/10 to-cyan-500/5' },
                    { id: 'chatgpt',    icon: Sparkles, label: 'ChatGPT',    sub: 'Best for general topics',   color: 'from-emerald-500/10 to-teal-500/5' }
                  ].map(opt => {\\g<2></motion.div>
                    )
                  })}
                </div>"""

content = step1_pattern.sub(new_step1_grid, content)

# Replace step 2
step2_pattern = re.compile(
    r'(\{\s*/\*\s*── STEP 2: GENERATE QUESTIONS ──\s*\*/\s*\}\s*\{step === 2 && \([\s\S]*?</motion\.div>\s*\)\s*\})',
    re.MULTILINE
)

new_step2 = """{/* ── STEP 2: GENERATE PROMPT ── */}
            {step === 2 && (
              <motion.div
                key="s2"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h2 className="font-black text-text-primary tracking-tight mb-1" style={{ fontSize: getTypo('title') }}>
                    Generate Prompt
                  </h2>
                  <p className="text-text-secondary font-medium" style={{ fontSize: getTypo('body') }}>
                    Select how many questions you need, then copy the prompt.
                  </p>
                </div>

                <div className="bg-card-bg border border-border-subtle/20 rounded-3xl p-6 space-y-6 shadow-sm">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest block opacity-60">
                      Target Question Count
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {[10, 30, 50, 100].map(c => (
                        <button
                          key={c}
                          onClick={() => { setTargetCount(c); setCustomCount(''); }}
                          className={`px-7 py-2.5 rounded-xl font-black text-sm transition-all border-2 ${
                            targetCount === c
                              ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                              : 'bg-hover-bg/50 text-text-secondary border-border-subtle/20 hover:border-primary/30 hover:text-text-primary'
                          }`}
                        >
                          {c} MCQs
                        </button>
                      ))}
                      <div className="relative">
                        <Settings2 size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary opacity-40" />
                        <input
                          type="number"
                          placeholder="Custom"
                          value={customCount}
                          onChange={(e) => { setCustomCount(e.target.value); setTargetCount(0); }}
                          className="w-28 bg-hover-bg/50 border-2 border-border-subtle/20 rounded-xl pl-9 pr-3 py-2.5 text-sm font-black focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all text-text-primary"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-hover-bg/50 p-4 rounded-xl border border-border-subtle/20 relative">
                    <p className="text-sm font-medium text-text-secondary pr-12 line-clamp-3">
                      You are a strict JSON generator for a production exam system. Your task is to generate high-quality bilingual (English + Telugu) multiple-choice questions...
                    </p>
                    <button onClick={handleCopyPrompt} className="absolute right-4 top-4 p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors">
                      {copied ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                  </div>
                  
                  <div className="flex justify-end gap-3">
                    <a href={sourceType === 'notebooklm' ? 'https://notebooklm.google.com' : 'https://chatgpt.com'} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-6 py-3 rounded-xl bg-hover-bg/80 text-text-primary font-bold text-sm border-2 border-border-subtle hover:border-primary/30 transition-all">
                      Open {sourceType === 'notebooklm' ? 'NotebookLM' : 'ChatGPT'} <ExternalLink size={16} />
                    </a>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button onClick={prevStep} className="text-text-secondary font-black uppercase tracking-widest text-xs flex items-center gap-1.5 hover:text-text-primary transition-colors">
                    <ChevronLeft size={16} /> Back
                  </button>
                  <button onClick={nextStep} className="bg-primary text-white px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/25 flex items-center gap-2">
                    Next Step <ChevronRight size={14} />
                  </button>
                </div>
              </motion.div>
            )}"""

content = step2_pattern.sub(new_step2, content)

# Now, step 3 is Review. Let's change Review to step 4, Setup to step 5, Publish to step 6.
content = content.replace('{/* ── STEP 3: PREVIEW & EDIT ── */}', '{/* ── STEP 4: PREVIEW & EDIT ── */}')
content = content.replace('{step === 3 && (', '{step === 4 && (')
content = content.replace('key="s3"', 'key="s4"')

content = content.replace('{/* ── STEP 4: EXAM SETUP ── */}', '{/* ── STEP 5: EXAM SETUP ── */}')
content = content.replace('{step === 4 && (', '{step === 5 && (')
# It has key="s4" originally, replace with key="s5"
content = content.replace('key="s4"', 'key="s5"')

# Add step 3 Paste JSON before step 4
step3_new = """{/* ── STEP 3: PASTE JSON ── */}
            {step === 3 && (
              <motion.div
                key="s3"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h2 className="font-black text-text-primary tracking-tight mb-1" style={{ fontSize: getTypo('title') }}>
                    Paste JSON Output
                  </h2>
                  <p className="text-text-secondary font-medium" style={{ fontSize: getTypo('body') }}>
                    Paste the generated JSON array from the AI below.
                  </p>
                </div>

                <div className="space-y-4">
                  <textarea
                    value={rawJson}
                    onChange={e => { setRawJson(e.target.value); setJsonError(null); }}
                    placeholder="Paste the JSON output here..."
                    className="w-full bg-card-bg border-2 border-border-subtle/20 rounded-2xl p-4 font-mono text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all resize-y shadow-sm"
                    style={{ height: getDimension('jsonH') }}
                  />
                  {jsonError && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3 flex items-start gap-3"
                    >
                      <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
                      <span className="text-xs font-bold text-red-500 leading-tight">{jsonError}</span>
                    </motion.div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button onClick={prevStep} className="text-text-secondary font-black uppercase tracking-widest text-xs flex items-center gap-1.5 hover:text-text-primary transition-colors">
                    <ChevronLeft size={16} /> Back
                  </button>
                  <button onClick={handlePasteJson} className="bg-primary text-white px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/25 flex items-center gap-2">
                    Parse JSON <Sparkles size={14} />
                  </button>
                </div>
              </motion.div>
            )}

            """

content = content.replace('{/* ── STEP 4: PREVIEW & EDIT ── */}', step3_new + '{/* ── STEP 4: PREVIEW & EDIT ── */}')

# Replace step 6 Publish -> Wait, it was already {step === 6 && (
# But wait, original code had "── STEP 6: REVIEW & PUBLISH ──", we just need to make sure the step numbers align.
# Original Setup was step 4. In my code I replaced it with 5.
# Did the original Publish have {step === 6 && (? Wait! In original code:
# `{/* ── STEP 6: REVIEW & PUBLISH ── */}`
# `{step === 6 && (`
# Wait, if original was 6, then what was step 5? 
# Ah! Look at original `SubAdminCreate.tsx`:
# It jumped from step 4 to step 6? Let's check the view file output.

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
