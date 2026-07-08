import type { TopicSection, TopicSectionItem } from '../types/exam.types'

/**
 * Outline Text Parser
 * Supports:
 *   1. Section Title          → creates a section group
 *   1.1 Sub-heading           → creates a card inside that section
 *   1.1.1 Deeper sub-heading  → treated as a card inside its parent
 *   Plain text below a heading → becomes that card's body text
 */
export function parseOutlineText(text: string, lang: 'en' | 'te'): TopicSection[] {
  const sections: TopicSection[] = []
  let currentSection: TopicSection | null = null
  let currentItem: TopicSectionItem | null = null
  let itemBodyLines: string[] = []

  const flushItem = () => {
    if (currentItem) {
      // Detect if heading indicates this should be a bullet list
      const headingRaw = lang === 'en' ? currentItem.heading_en : currentItem.heading_te
      const lowerHeading = headingRaw?.toLowerCase() || ''
      const isBulletList = lowerHeading.includes('bullet points') || 
                           lowerHeading.includes('bullets') || 
                           lowerHeading.includes('points') ||
                           lowerHeading.includes('బుల్లెట్ పాయింట్లు') ||
                           lowerHeading.includes('బుల్లెట్లు') ||
                           lowerHeading.includes('అంశాలు')

      // Preserve newlines on split paragraphs and bullet lists
      const body = itemBodyLines.map(l => {
        const trimmedLine = l.trim()
        if (!trimmedLine) return ''
        if (isBulletList && !trimmedLine.match(/^(?:[-*•+]|\d+\.)/)) {
          return `- ${trimmedLine}`
        }
        return trimmedLine
      }).filter(Boolean).join('\n')

      if (body) {
        if (lang === 'en') {
          currentItem.body_en = body
        } else {
          currentItem.body_te = body
        }
        if (currentSection) {
          currentSection.items.push(currentItem)
        }
      }
      itemBodyLines = []
      currentItem = null
    }
  }

  const lines = text.split('\n')

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue

    // Skip divider/separator lines (e.g. ---, ===, * * *)
    if (line.match(/^[-\s_=\*]{3,}$/)) continue

    // 1. Top-level heading: "1." / "1)" etc. (but not "1.1") or known section headings without numbers
    const top = line.match(/^(\d+)[.)]\s+(.+)/)
    let isTopLevel = false
    let sectionNum = ''
    let labelText = ''

    if (top && !line.match(/^\d+\.\d/)) {
      isTopLevel = true
      sectionNum = top[1]
      labelText = top[2].trim()
    } else {
      const lowerLine = line.toLowerCase()
      const knownHeadings = [
        'introduction & overview',
        'core concepts & exhaustive analysis',
        'memory trick & mnemonics',
        'quick summary & exam points',
        'परिचयं & अवलोकनम', // in case of hindi/telugu font copies
        'పరిచయం & అవలోకనం',
        'ప్రధాన భావనలు & సమగ్ర విశ్లేషణ',
        'మెమరీ ట్రిక్ & జ్ఞాపకశక్తి చిట్కాలు',
        'త్వరిత సారాంశం & ఎగ్జామ్ పాయింట్స్'
      ]
      if (knownHeadings.includes(lowerLine)) {
        isTopLevel = true
        labelText = line
        if (lowerLine.includes('introduction') || lowerLine.includes('పరిచయం')) sectionNum = '1'
        else if (lowerLine.includes('core') || lowerLine.includes('ప్రధాన')) sectionNum = '2'
        else if (lowerLine.includes('memory') || lowerLine.includes('మెమరీ')) sectionNum = '3'
        else if (lowerLine.includes('summary') || lowerLine.includes('సారాంశం')) sectionNum = '4'
      }
    }

    if (isTopLevel) {
      flushItem()
      
      if (currentSection) {
        sections.push(currentSection)
      }
      
      const lowerLabel = labelText.toLowerCase()
      let type: 'cards' | 'list' | 'quick_summary' | 'memory_trick' | 'sites' | 'key_features' = 'cards'

      if (lowerLabel.includes('memory trick') || lowerLabel.includes('mnemonics') || lowerLabel.includes('జ్ఞాపకశక్తి') || lowerLabel.includes('చిట్కాలు')) {
        type = 'memory_trick'
      } else if (lowerLabel.includes('summary') || lowerLabel.includes('exam points') || lowerLabel.includes('రాపిడ్-ఫైర్') || lowerLabel.includes('సారాంశం')) {
        type = 'quick_summary'
      } else if (lowerLabel.includes('bullet points') || lowerLabel.includes('bullets') || lowerLabel.includes('points list') || lowerLabel.includes('జాబితా') || lowerLabel.includes('బుల్లెట్ పాయింట్లు')) {
        type = 'list'
      } else if (lowerLabel.includes('sites') || lowerLabel.includes('కీలక ప్రాంతాలు')) {
        type = 'sites'
      } else if (lowerLabel.includes('key features') || lowerLabel.includes('లక్షణాలు')) {
        type = 'key_features'
      }

      currentSection = {
        type,
        label_en: lang === 'en' ? labelText : '',
        label_te: lang === 'te' ? labelText : '',
        items: []
      }
      
      // Also create a potential card for the main heading in case it has text directly under it
      currentItem = {
        icon: '',
        heading_en: lang === 'en' ? `${sectionNum}. ${labelText}` : '',
        heading_te: lang === 'te' ? `${sectionNum}. ${labelText}` : '',
        body_en: '',
        body_te: ''
      }
      continue
    }

    // 2. Sub-level heading: "1.1" / "1.2.3" etc.
    const sub = line.match(/^(\d+(?:\.\d+)+)\.?\s+(.+)/)
    if (sub) {
      flushItem()
      
      if (!currentSection) {
        currentSection = {
          type: 'cards',
          label_en: lang === 'en' ? 'Content' : '',
          label_te: lang === 'te' ? 'విషయాలు' : '',
          items: []
        }
      }
      
      const headingText = sub[2].trim()
      currentItem = {
        icon: '',
        heading_en: lang === 'en' ? `${sub[1]}. ${headingText}` : '',
        heading_te: lang === 'te' ? `${sub[1]}. ${headingText}` : '',
        body_en: '',
        body_te: ''
      }
      continue
    }

    // 3. Body text — accumulate lines for the current item
    if (currentItem) {
      itemBodyLines.push(line)
    } else if (currentSection) {
      currentItem = {
        icon: '',
        heading_en: '',
        heading_te: '',
        body_en: '',
        body_te: ''
      }
      itemBodyLines.push(line)
    }
  }

  flushItem()
  if (currentSection) {
    sections.push(currentSection)
  }

  // Filter out sections with no items
  return sections.filter(s => s.items.length > 0)
}

export function reconstructOutlineText(sections: TopicSection[], lang: 'en' | 'te'): string {
  if (!sections || sections.length === 0) return ''
  const lines: string[] = []
  
  sections.forEach((sec, secIdx) => {
    const label = lang === 'en' ? sec.label_en : sec.label_te
    
    // Check if the first item already has a heading that matches the section label or is a main heading (like "1. ...")
    const firstItem = sec.items?.[0]
    const firstHeading = firstItem ? (lang === 'en' ? firstItem.heading_en : firstItem.heading_te) : ''
    const hasMainHeadingCard = firstHeading && firstHeading.match(/^\d+[.)]/) && !firstHeading.match(/^\d+\.\d/)
    
    if (!hasMainHeadingCard && label) {
      lines.push(`${secIdx + 1}. ${label}`)
    }
    
    sec.items?.forEach(item => {
      const heading = lang === 'en' ? item.heading_en : item.heading_te
      const body = lang === 'en' ? item.body_en : item.body_te
      
      if (heading) {
        lines.push(heading)
      }
      if (body) {
        lines.push(body)
      }
      lines.push('')
    })
  })
  
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

export interface ParsedHeading {
  text: string;
  numberPrefix?: string;
  bulletPrefix?: string;
  tag?: 'IMP' | 'NOTE' | 'TIP' | 'ALERT' | 'KEY' | 'INFO';
}

/**
 * Parses a heading text to extract list numbers, bullet prefixes, and bracketed alert tags.
 * Example: "1.1.1. [IMP] Maurya Dynasties" -> { text: "Maurya Dynasties", numberPrefix: "1.1.1", tag: "IMP" }
 * Also strips trailing parenthetical format-type suffixes like "(Bullet Points)" / "(Table)"
 * that are used for section classification but should not appear in the rendered UI.
 */
export function parseHeading(heading: string): ParsedHeading {
  if (!heading) return { text: '' };
  
  let temp = heading.trim();
  let numberPrefix: string | undefined;
  let bulletPrefix: string | undefined;
  let tag: string | undefined;
  
  // 1. Detect and extract list numbers/letters (e.g. "1.2.3." or "1." or "A.")
  const numMatch = temp.match(/^(\d+(?:\.\d+)*\.?|[A-Za-z]\.)(\s*(.+))?/);
  if (numMatch && numMatch[3]) {
    numberPrefix = numMatch[1].replace(/\.$/, ''); // Remove trailing dot for badge display
    temp = numMatch[3].trim();
  } else {
    // 2. Detect and extract bullet symbols (e.g. "-", "*", "•") if no number is present
    const bulletMatch = temp.match(/^([-*•])\s*(.+)/);
    if (bulletMatch) {
      bulletPrefix = bulletMatch[1];
      temp = bulletMatch[2].trim();
    }
  }
  
  // 3. Detect and extract bracketed tags (e.g. "[IMP]" or "[NOTE]")
  const tagMatch = temp.match(/^\[(IMP|IMPORTANT|NOTE|TIP|ALERT|WARNING|KEY|INFO)\]\s*(.+)/i);
  if (tagMatch) {
    const rawTag = tagMatch[1].toUpperCase();
    if (rawTag === 'IMPORTANT') tag = 'IMP';
    else if (rawTag === 'WARNING') tag = 'ALERT';
    else tag = rawTag;
    
    temp = tagMatch[2].trim();
  }
  
  // 4. Strip trailing parenthetical format-type suffixes used for parser classification
  //    so they don't appear in the rendered UI heading text.
  //    e.g. "Key Features (Bullet Points)" → "Key Features"
  //    e.g. "Comparison of Structures (Table)" → "Comparison of Structures"
  const formatSuffixPattern = /\s*\(\s*(?:bullet\s*points?|bullets?|points?\s*list|table|పట్టిక|బుల్లెట్\s*పాయింట్లు|బుల్లెట్లు|అంశాలు|జాబితా|చిట్కా|mnemonic|mnemonics?|memory\s*trick)\s*\)$/i;
  temp = temp.replace(formatSuffixPattern, '').trim();
  
  return {
    text: temp,
    numberPrefix,
    bulletPrefix,
    tag: tag as any
  };
}
