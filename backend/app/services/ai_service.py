import json
import logging
import re
from typing import Any, Dict, List, Optional
import httpx
from app.config import settings

logger = logging.getLogger(__name__)

GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

class AIService:
    """Service for interacting with Google Gemini API or falling back to intelligent Mock Mode."""

    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model = settings.GEMINI_MODEL
        self.is_demo = settings.is_demo_mode

    async def _call_gemini_raw(self, prompt: str, system_instruction: Optional[str] = None) -> Optional[str]:
        """Calls Gemini API using httpx. Returns None if demo mode or call fails."""
        if self.is_demo or not self.api_key:
            return None

        url = f"{GEMINI_API_URL.format(model=self.model)}?key={self.api_key}"
        
        contents = []
        if system_instruction:
            contents.append({
                "role": "user",
                "parts": [{"text": f"System Guidelines:\n{system_instruction}\n\nTask:\n{prompt}"}]
            })
        else:
            contents.append({
                "role": "user",
                "parts": [{"text": prompt}]
            })

        payload = {
            "contents": contents,
            "generationConfig": {
                "temperature": 0.4,
                "maxOutputTokens": 2048,
            }
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(url, json=payload)
                if response.status_code == 200:
                    data = response.json()
                    candidates = data.get("candidates", [])
                    if candidates and "content" in candidates[0]:
                        parts = candidates[0]["content"].get("parts", [])
                        if parts:
                            return parts[0].get("text", "")
                else:
                    logger.warning(f"Gemini API returned status {response.status_code}: {response.text}")
                    return None
        except Exception as exc:
            logger.warning(f"Gemini API call failed with exception: {exc}. Falling back to demo mode.")
            return None

    # 1. Lesson Simplification
    async def simplify_lesson(self, text: str, language: str = "en", level: str = "standard") -> Dict[str, Any]:
        """
        Generates simplified learning material from extracted text.
        Supports English ('en') and Telugu ('te').
        """
        is_telugu = language.lower().startswith("te")
        lang_name = "Telugu (తెలుగు)" if is_telugu else "English"

        prompt = f"""
You are AccessLearn AI, an inclusive learning assistant designed for accessible education.
Target Language: {lang_name}
Difficulty / Format Level: {level}

Please analyze the following study material and produce an accessible, easy-to-understand explanation:
{text[:4000]}

Format your response clearly with:
1. 🌟 **Executive Overview / సంగ్రహం**: 2-3 accessible sentences capturing the core idea.
2. 🔑 **Key Concepts / ముఖ్య భావనలు**: 3-5 bullet points explaining key ideas in simple terms.
3. 📖 **Vocabulary / నిఘంటువు**: 2-3 important terms defined simply.
4. 💡 **Real-world Example / ఉదాహరణ**: A relatable, everyday metaphor or analogy.

Make sure the response is entirely in {lang_name}. Use clear formatting with Markdown.
"""

        gemini_response = await self._call_gemini_raw(prompt)
        if gemini_response:
            return {
                "simplified_text": gemini_response,
                "language": "te" if is_telugu else "en",
                "is_mock": False
            }

        # Mock / Demo Mode fallback
        return self._generate_mock_simplification(text, is_telugu, level)

    # 2. AI Tutor
    async def ask_tutor(
        self, 
        question: str, 
        context_text: Optional[str] = None, 
        chat_history: Optional[List[Dict[str, Any]]] = None,
        language: str = "en"
    ) -> Dict[str, Any]:
        """
        AI Tutor chat answering queries based on uploaded document context and history.
        """
        is_telugu = language.lower().startswith("te")
        lang_name = "Telugu (తెలుగు)" if is_telugu else "English"

        history_snippet = ""
        if chat_history:
            recent = chat_history[-4:]
            history_snippet = "\n".join([f"{m.get('role', 'user')}: {m.get('message', '')}" for m in recent])

        doc_context = f"\nRelevant study context:\n{context_text[:3500]}\n" if context_text else "\nNo specific document attached; answer using general accessible knowledge."

        prompt = f"""
You are AccessLearn AI Tutor, a friendly, patient, and encouraging tutor.
Target Language: {lang_name}
{doc_context}
Recent Conversation:
{history_snippet}

Student's Question: {question}

Instructions:
1. Provide a clear, encouraging answer directly addressing the student's question in {lang_name}.
2. If document context is provided, ground your answer in it.
3. Keep sentences readable, polite, and break complex thoughts into digestible paragraphs.
4. Conclude with a helpful follow-up tip or check for understanding.
"""

        gemini_response = await self._call_gemini_raw(prompt)
        if gemini_response:
            return {
                "answer": gemini_response,
                "language": "te" if is_telugu else "en",
                "is_mock": False
            }

        return self._generate_mock_tutor_response(question, context_text, is_telugu)

    # 3. Quiz Generation
    async def generate_quiz(self, text: str, num_questions: int = 4, language: str = "en") -> Dict[str, Any]:
        """
        Generates a multiple choice quiz based on the lesson text.
        Returns a list of questions with 4 options, correct answer index, and explanation.
        """
        is_telugu = language.lower().startswith("te")
        lang_name = "Telugu (తెలుగు)" if is_telugu else "English"

        prompt = f"""
Generate an accessible {num_questions}-question multiple choice quiz in {lang_name} based on the following material:
{text[:4000]}

CRITICAL REQUIREMENT: Output MUST be valid JSON only. Do not enclose in markdown code blocks if possible, or use standard ```json ``` formatting.
The JSON must follow this exact schema:
[
  {{
    "question": "Question text here",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_index": 0,
    "explanation": "Clear explanation of why this answer is correct in {lang_name}"
  }}
]
"""

        raw_response = await self._call_gemini_raw(prompt)
        if raw_response:
            try:
                # Clean json if wrapped in markdown code fence
                clean_json = re.sub(r"^```json\s*", "", raw_response.strip(), flags=re.IGNORECASE)
                clean_json = re.sub(r"```$", "", clean_json.strip())
                parsed = json.loads(clean_json)
                if isinstance(parsed, list) and len(parsed) > 0 and "question" in parsed[0]:
                    return {
                        "questions": parsed[:num_questions],
                        "language": "te" if is_telugu else "en",
                        "is_mock": False
                    }
            except Exception as e:
                logger.warning(f"Failed to parse Gemini quiz JSON: {e}. Falling back to mock generator.")

        return self._generate_mock_quiz(text, is_telugu, num_questions)

    # ==================== MOCK GENERATORS FOR DEMO MODE ====================

    def _extract_keywords(self, text: str) -> List[str]:
        words = re.findall(r'\b[A-Za-z]{4,}\b', text)
        common = {'this', 'that', 'with', 'from', 'have', 'were', 'which', 'their', 'about', 'there', 'would', 'could'}
        filtered = [w.capitalize() for w in words if w.lower() not in common]
        return list(dict.fromkeys(filtered))[:10] or ["Concepts", "Learning", "Analysis", "Principles"]

    def _generate_mock_simplification(self, text: str, is_telugu: bool, level: str) -> Dict[str, Any]:
        keywords = self._extract_keywords(text)
        kw_str = ", ".join(keywords[:4])

        if is_telugu:
            content = f"""🌟 **సంగ్రహం (Executive Summary)**
ఈ పత్రం ప్రాథమికంగా ముఖ్యమైన భావనలను వివరిస్తుంది: **{kw_str}**. ఇది విద్యార్థులకు సులభంగా అర్థమయ్యే రీతిలో రూపొందించబడిన విద్యా సామగ్రి.

🔑 **ముఖ్య భావనలు (Key Concepts)**
- **ప్రాథమిక సిద్ధాంతం**: అధ్యయన అంశం సులభమైన ఉదాహరణలతో వివరించబడింది.
- **ప్రధాన అంశాలు**: ముఖ్య భావనలు విద్యార్థి సాధనను మరియు అవగాహనను పెంచడానికి తోడ్పడతాయి.
- **ఆచరణాత్మక ఉపయోగం**: ఈ పరిజ్ఞానం నిజ జీవిత సమస్యలను పరిష్కరించడంలో సహాయపడుతుంది.
- **లక్ష్యం**: విభిన్న సామర్థ్యాలు కలిగిన అభ్యాసకులందరికీ సమాన విద్యా అవకాశాలు కల్పించడం.

📖 **ముఖ్య పదకోశం (Vocabulary)**
- **అవగాహన (Understanding)**: ఒక అంశాన్ని లోతుగా గ్రహించడం.
- **విధానం (Methodology)**: ఒక లక్ష్యాన్ని చేరుకోవడానికి అనుసరించే పద్ధతి.

💡 **నిజజీవిత ఉదాహరణ (Real-World Example)**
ఒక భవనాన్ని నిర్మించడానికి పునాది ఎంత ముఖ్యమో, ఒక కొత్త సబ్జెక్టును నేర్చుకోవడానికి ఈ ప్రాథమిక అంశాలు అంతే అవసరం!
"""
        else:
            content = f"""🌟 **Overview**
This material centers around key subject topics including: **{kw_str}**. It is structured to help learners master the core fundamentals step-by-step.

🔑 **Key Concepts**
- **Core Principles**: The document establishes foundational concepts designed for progressive comprehension.
- **Systematic Structure**: Information is organized logically to highlight primary themes: *{keywords[0] if keywords else 'Topic'}* and practical applications.
- **Accessibility & Inclusivity**: Complex phrasing has been distilled into direct, easy-to-read segments.
- **Practical Relevance**: The concepts outlined can be applied directly in academic and real-world problem solving.

📖 **Key Terminology**
- **{keywords[0] if keywords else 'Concept'}**: The primary subject matter discussed throughout this module.
- **Foundation**: The underlying structure supporting more advanced learning modules.

💡 **Real-world Example**
Think of learning this topic like building a bridge: you first assemble the sturdy foundation posts before laying down the roadway!
"""

        return {
            "simplified_text": content,
            "language": "te" if is_telugu else "en",
            "is_mock": True
        }

    def _generate_mock_tutor_response(self, question: str, context_text: Optional[str], is_telugu: bool) -> Dict[str, Any]:
        if is_telugu:
            return {
                "answer": f"నమస్కారం! మీ ప్రశ్న: **\"{question}\"**.\n\nమీరు అడిగిన ప్రశ్నకు సంబంధించిన వివరణ ఇక్కడ ఉంది:\n\n1. ఈ అంశం మీ అభ్యాస సామగ్రిలోని ముఖ్యాంశాలపై ఆధారపడి ఉంది.\n2. సులభంగా చెప్పాలంటే, ఇది ఒక క్రమబద్ధమైన విధానాన్ని అనుసరిస్తుంది.\n3. మీరు దీనిని చిన్న చిన్న భాగాలుగా విభజించి చదివితే మరింత సులభంగా గుర్తుంటుంది.\n\nమీకు ఇంకా ఏమైనా సందేహాలు ఉంటే నిస్సందేహంగా అడగండి! 😊",
                "language": "te",
                "is_mock": True
            }

        return {
            "answer": f"Hello! That's a great question regarding: **\"{question}\"**.\n\nBased on the study materials:\n\n1. **Core Understanding**: The foundation of this concept relies on breaking down complex problems into clear, manageable steps.\n2. **Context Connection**: Notice how this directly relates to the main ideas introduced in your document.\n3. **Practical Application**: You can test this by applying the rule to a simple test case first.\n\nDoes this clarify your question, or would you like another example?",
            "language": "en",
            "is_mock": True
        }

    def _generate_mock_quiz(self, text: str, is_telugu: bool, num_questions: int) -> Dict[str, Any]:
        keywords = self._extract_keywords(text)
        k1 = keywords[0] if len(keywords) > 0 else "Concept"
        k2 = keywords[1] if len(keywords) > 1 else "Analysis"
        k3 = keywords[2] if len(keywords) > 2 else "Structure"

        if is_telugu:
            questions = [
                {
                    "question": f"ఈ పాఠ్యాంశంలో చర్చించబడిన ప్రధాన అంశం ఏది?",
                    "options": [
                        f"{k1} కు సంబంధించిన ప్రాథమిక సూత్రాలు",
                        "చారిత్రక పరిణామ క్రమం మాత్రమే",
                        "సంక్లిష్టమైన గణిత సమీకరణాలు",
                        "కేవలం పుస్తక సమీక్ష"
                    ],
                    "correct_index": 0,
                    "explanation": f"ఈ అధ్యయన సామగ్రి ప్రాథమికంగా {k1} అంశంపై కేంద్రీకృతమై వివరణ ఇస్తుంది."
                },
                {
                    "question": f"పాఠ్యాంశం ప్రకారం {k2} యొక్క ముఖ్య ఉద్దేశ్యం ఏమిటి?",
                    "options": [
                        "సమయాన్ని వృధా చేయడం",
                        "అవగాహనను మరియు ఫలితాలను మెరుగుపరచడం",
                        "నియమాలను కఠినతరం చేయడం",
                        "అన్ని విధానాలను రద్దు చేయడం"
                    ],
                    "correct_index": 1,
                    "explanation": "సమగ్ర అధ్యయనం ఎల్లప్పుడూ అభ్యాసకుని అవగాహన మరియు సామర్థ్యాన్ని మెరుగుపరచడానికి ఉద్దేశించబడింది."
                },
                {
                    "question": "సమ్మిళిత విద్యా విధానం (Inclusive Learning) యొక్క ప్రధాన లక్షణం ఏమిటి?",
                    "options": [
                        "కేవలం కొందరికి మాత్రమే ప్రాధాన్యత",
                        "అందరు అభ్యాసకుల అవసరాలకు అనుగుణంగా సులభ ప్రాప్యత కల్పించడం",
                        "కఠినమైన పరీక్షలు నిర్వహించడం",
                        "సాంకేతికతను పూర్తిగా నివారించడం"
                    ],
                    "correct_index": 1,
                    "explanation": "సమ్మిళిత విద్య ప్రతి ఒక్కరికీ సులభంగా అర్థమయ్యే రీతిలో సమాన అవకాశాలను కల్పిస్తుంది."
                }
            ]
        else:
            questions = [
                {
                    "question": f"What is the primary focus of the uploaded material regarding {k1}?",
                    "options": [
                        f"Establishing fundamental principles of {k1}",
                        "Outlining completely unrelated historical timelines",
                        "Listing unverified hypotheses",
                        "Providing advanced unrelated proofs"
                    ],
                    "correct_index": 0,
                    "explanation": f"The material directly establishes the core concepts and fundamental understanding of {k1}."
                },
                {
                    "question": f"How is {k2} typically utilized in this domain?",
                    "options": [
                        "To obscure core information",
                        "As a method to systematically organize and evaluate concepts",
                        "Only as a placeholder without practical use",
                        "To prevent beginner students from participating"
                    ],
                    "correct_index": 1,
                    "explanation": f"{k2} provides a systematic structure for breaking down and evaluating ideas effectively."
                },
                {
                    "question": "What is the primary objective of accessible and inclusive learning platforms?",
                    "options": [
                        "Restricting access to specialized hardware only",
                        "Ensuring every learner has equitable, barrier-free access to educational content",
                        "Eliminating interactive learning completely",
                        "Enforcing only a single learning style"
                    ],
                    "correct_index": 1,
                    "explanation": "Inclusive learning platforms remove cognitive and sensory barriers so everyone can learn effectively."
                },
                {
                    "question": f"Which approach best reinforces the principles of {k3}?",
                    "options": [
                        "Iterative review with interactive quizzes and simplified explanations",
                        "Passive reading without checking comprehension",
                        "Ignoring definitions and vocabulary",
                        "Skipping foundational chapters"
                    ],
                    "correct_index": 0,
                    "explanation": "Active engagement through simplified breakdowns and practice quizzes maximizes retention and understanding."
                }
            ]

        return {
            "questions": questions[:num_questions],
            "language": "te" if is_telugu else "en",
            "is_mock": True
        }

# Global singleton
ai_service = AIService()
