export interface TemplateSection {
  id: string
  label: string
  placeholder: string
}

export interface NoteTemplate {
  id: string
  name: string
  sections: TemplateSection[]
  systemPrompt: string
}

export const templates: NoteTemplate[] = [
  {
    id: 'soap',
    name: 'SOAP Note',
    sections: [
      { id: 'subjective', label: 'Subjective', placeholder: 'Chief complaint, HPI, ROS...' },
      { id: 'objective', label: 'Objective', placeholder: 'Vitals, physical exam, labs...' },
      { id: 'assessment', label: 'Assessment', placeholder: 'Diagnoses, differential...' },
      { id: 'plan', label: 'Plan', placeholder: 'Treatment plan, follow-up...' },
    ],
    systemPrompt: `You are a medical scribe. Organize the clinical information provided into a SOAP note. Use exactly these markdown headers for each section:
## Subjective
## Objective
## Assessment
## Plan

Be thorough but concise. Use standard medical terminology and abbreviations. Include all relevant details from the input under the appropriate section.`,
  },
  {
    id: 'hp',
    name: 'H&P',
    sections: [
      { id: 'chief-complaint', label: 'Chief Complaint', placeholder: 'Reason for visit...' },
      { id: 'hpi', label: 'History of Present Illness', placeholder: 'Onset, duration, severity...' },
      { id: 'pmh', label: 'Past Medical History', placeholder: 'Prior diagnoses, surgeries...' },
      { id: 'medications', label: 'Medications', placeholder: 'Current medications...' },
      { id: 'allergies', label: 'Allergies', placeholder: 'Drug and other allergies...' },
      { id: 'social-history', label: 'Social History', placeholder: 'Tobacco, alcohol, occupation...' },
      { id: 'family-history', label: 'Family History', placeholder: 'Relevant family conditions...' },
      { id: 'ros', label: 'Review of Systems', placeholder: 'Systems review...' },
      { id: 'physical-exam', label: 'Physical Exam', placeholder: 'Vitals, exam findings...' },
      { id: 'assessment-plan', label: 'Assessment & Plan', placeholder: 'Diagnoses and treatment plan...' },
    ],
    systemPrompt: `You are a medical scribe. Organize the clinical information into a complete History & Physical. Use exactly these markdown headers:
## Chief Complaint
## History of Present Illness
## Past Medical History
## Medications
## Allergies
## Social History
## Family History
## Review of Systems
## Physical Exam
## Assessment & Plan

Be thorough. Use standard medical terminology.`,
  },
  {
    id: 'progress',
    name: 'Progress Note',
    sections: [
      { id: 'interval-history', label: 'Interval History', placeholder: 'Changes since last visit...' },
      { id: 'physical-exam', label: 'Physical Exam', placeholder: 'Exam findings...' },
      { id: 'labs-studies', label: 'Labs/Studies', placeholder: 'Lab results, imaging...' },
      { id: 'assessment', label: 'Assessment', placeholder: 'Current diagnoses...' },
      { id: 'plan', label: 'Plan', placeholder: 'Ongoing plan, changes...' },
    ],
    systemPrompt: `You are a medical scribe. Organize the clinical information into a Progress Note. Use exactly these markdown headers:
## Interval History
## Physical Exam
## Labs/Studies
## Assessment
## Plan

Be concise and focus on interval changes. Use standard medical terminology.`,
  },
  {
    id: 'consult',
    name: 'Consult Note',
    sections: [
      { id: 'reason', label: 'Reason for Consult', placeholder: 'Referring question...' },
      { id: 'hpi', label: 'History of Present Illness', placeholder: 'Relevant history...' },
      { id: 'assessment', label: 'Assessment', placeholder: 'Consultant impression...' },
      { id: 'recommendations', label: 'Recommendations', placeholder: 'Suggested management...' },
    ],
    systemPrompt: `You are a medical consultant scribe. Organize the clinical information into a Consult Note. Use exactly these markdown headers:
## Reason for Consult
## History of Present Illness
## Assessment
## Recommendations

Be thorough in your assessment and specific in recommendations. Use standard medical terminology.`,
  },
  {
    id: 'discharge',
    name: 'Discharge Summary',
    sections: [
      { id: 'admission-dx', label: 'Admission Diagnosis', placeholder: 'Admitting diagnoses...' },
      { id: 'hospital-course', label: 'Hospital Course', placeholder: 'Summary of stay...' },
      { id: 'discharge-dx', label: 'Discharge Diagnosis', placeholder: 'Diagnoses at discharge...' },
      { id: 'discharge-meds', label: 'Discharge Medications', placeholder: 'Medications on discharge...' },
      { id: 'follow-up', label: 'Follow-up', placeholder: 'Follow-up appointments, instructions...' },
    ],
    systemPrompt: `You are a medical scribe. Organize the clinical information into a Discharge Summary. Use exactly these markdown headers:
## Admission Diagnosis
## Hospital Course
## Discharge Diagnosis
## Discharge Medications
## Follow-up

Provide a clear, comprehensive summary suitable for continuity of care. Use standard medical terminology.`,
  },
  {
    id: 'procedure',
    name: 'Procedure Note',
    sections: [
      { id: 'indication', label: 'Indication', placeholder: 'Reason for procedure...' },
      { id: 'procedure', label: 'Procedure', placeholder: 'Steps performed...' },
      { id: 'findings', label: 'Findings', placeholder: 'Procedural findings...' },
      { id: 'complications', label: 'Complications', placeholder: 'Any complications...' },
      { id: 'disposition', label: 'Disposition', placeholder: 'Post-procedure plan...' },
    ],
    systemPrompt: `You are a medical scribe. Organize the clinical information into a Procedure Note. Use exactly these markdown headers:
## Indication
## Procedure
## Findings
## Complications
## Disposition

Document the procedure clearly and thoroughly. Use standard medical terminology.`,
  },
]

export function parseAIResponseToSections(response: string, template: NoteTemplate): Record<string, string> {
  const sections: Record<string, string> = {}

  // Initialize all sections as empty
  for (const section of template.sections) {
    sections[section.id] = ''
  }

  // Split by ## headers and map to section IDs
  const headerPattern = /^##\s+(.+)$/gm
  const parts: { label: string, startIndex: number }[] = []
  let match: RegExpExecArray | null

  while ((match = headerPattern.exec(response)) !== null) {
    parts.push({ label: match[1].trim(), startIndex: match.index + match[0].length })
  }

  for (let i = 0; i < parts.length; i++) {
    const endIndex = i + 1 < parts.length ? parts[i + 1].startIndex - parts[i + 1].label.length - 3 : response.length
    const content = response.slice(parts[i].startIndex, endIndex).trim()

    // Match header text to template section label (case-insensitive, flexible)
    const matchedSection = template.sections.find(s =>
      s.label.toLowerCase() === parts[i].label.toLowerCase()
      || s.label.toLowerCase().replace(/[&]/g, 'and').includes(parts[i].label.toLowerCase().replace(/[&]/g, 'and'))
      || parts[i].label.toLowerCase().includes(s.label.toLowerCase()),
    )

    if (matchedSection)
      sections[matchedSection.id] = content
  }

  return sections
}
