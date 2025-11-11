/**
 * 四個步驟的 Prompt 模板
 * 這些提示詞可以根據實際需求調整
 */

export type StepType = 'job_intake' | 'sourcing' | 'screening' | 'interview';

/**
 * 取得指定步驟的 Prompt
 */
export function getPrompt(step: StepType, input: string, isRetry: boolean = false): string {
  const retryHint = isRetry ? '\n\n請產出一個與之前不同的版本，可以從不同角度或重點來呈現。' : '';

  switch (step) {
    case 'job_intake':
      return getJobIntakePrompt(input) + retryHint;

    case 'sourcing':
      return getSourcingPrompt(input) + retryHint;

    case 'screening':
      return getScreeningPrompt(input) + retryHint;

    case 'interview':
      return getInterviewPrompt(input) + retryHint;

    default:
      throw new Error(`未知的步驟類型: ${step}`);
  }
}

/**
 * 職缺需求（Job Intake）Prompt
 * 解析 JD，輸出人才畫像與結構化欄位
 */
function getJobIntakePrompt(input: string): string {
  return `你是一位資深的 HR 招募顧問，請根據以下職缺說明（JD），分析並產出結構化的人才畫像。

職缺說明：
${input}

請以 JSON 格式回傳以下資訊：
{
  "job_title": "職缺名稱",
  "department": "部門",
  "experience_required": "所需經驗（例如：1-3年）",
  "skills": ["技能1", "技能2", "技能3"],
  "personality_traits": ["特質1", "特質2"],
  "education_background": "學歷要求（可選）",
  "work_mode": "工作模式（全職/兼職/遠端/混合）",
  "salary_range": "薪資範圍（如有提及）",
  "talent_profile": "完整的人才畫像描述（一段文字，說明這個職缺需要什麼樣的人才）",
  "key_requirements": ["關鍵需求1", "關鍵需求2"],
  "nice_to_have": ["加分項目1", "加分項目2"]
}

請確保回傳的是有效的 JSON 格式，不要包含額外的 markdown 標記。`;
}

/**
 * 人才搜尋（Sourcing）Prompt
 * 產出招募文案、搜尋關鍵字、邀請訊息
 */
function getSourcingPrompt(input: string): string {
  return `你是一位資深的 HR 招募顧問，請根據以下職缺資訊，產出招募相關的文案與搜尋策略。

職缺資訊：
${input}

請以 JSON 格式回傳以下資訊：
{
  "recruitment_post": "一段吸引人的招募貼文（適合放在 LinkedIn、Facebook、PTT 等平台）",
  "search_keywords": ["關鍵字1", "關鍵字2", "關鍵字3", "關鍵字4", "關鍵字5"],
  "linkedin_invitation": "LinkedIn 邀請訊息的範本",
  "email_template": "Email 邀請範本",
  "platforms": ["建議的招募平台1", "建議的招募平台2"],
  "target_audience": "目標受眾描述"
}

請確保回傳的是有效的 JSON 格式，不要包含額外的 markdown 標記。`;
}

/**
 * 初步篩選（Screening）Prompt
 * JD + 履歷 → 匹配度、優勢、風險、建議面試問題
 */
function getScreeningPrompt(input: string): string {
  return `你是一位資深的 HR 招募顧問，請根據以下職缺說明（JD）和履歷，進行初步篩選分析。

輸入內容：
${input}

請注意：如果輸入中包含 "---" 分隔符，前面是 JD，後面是履歷。如果沒有分隔符，請自行判斷。

請以 JSON 格式回傳以下資訊：
{
  "match_score": 85,
  "overall_assessment": "整體評估（一段文字）",
  "strengths": ["優勢1", "優勢2", "優勢3"],
  "concerns": ["疑慮或風險1", "疑慮或風險2"],
  "skill_match": {
    "matched": ["已具備的技能1", "已具備的技能2"],
    "missing": ["缺少的技能1", "缺少的技能2"]
  },
  "suggested_interview_questions": [
    "建議的面試問題1",
    "建議的面試問題2",
    "建議的面試問題3",
    "建議的面試問題4",
    "建議的面試問題5"
  ],
  "recommendation": "是否建議進入下一階段面試，以及理由"
}

match_score 請給 0-100 的分數。
請確保回傳的是有效的 JSON 格式，不要包含額外的 markdown 標記。`;
}

/**
 * 面試階段（Interview）Prompt
 * 面試逐字稿 → 摘要、優勢/疑慮、分數
 */
function getInterviewPrompt(input: string): string {
  return `你是一位資深的 HR 招募顧問，請根據以下面試逐字稿，進行面試評估。

面試逐字稿：
${input}

請以 JSON 格式回傳以下資訊：
{
  "interview_summary": "面試摘要（一段文字，總結整個面試過程）",
  "communication_score": 85,
  "technical_score": 80,
  "cultural_fit_score": 90,
  "overall_score": 85,
  "key_highlights": ["面試亮點1", "面試亮點2", "面試亮點3"],
  "concerns": ["疑慮或需要進一步確認的點1", "疑慮或需要進一步確認的點2"],
  "strengths_demonstrated": ["展現的優勢1", "展現的優勢2"],
  "areas_for_clarification": ["需要澄清的問題1", "需要澄清的問題2"],
  "recommendation": "是否建議錄取，以及理由",
  "next_steps": "建議的下一步行動"
}

所有分數請給 0-100。
請確保回傳的是有效的 JSON 格式，不要包含額外的 markdown 標記。`;
}

/**
 * Chat 功能的系統提示詞
 */
export const CHAT_SYSTEM_PROMPT = `你是一位專門協助 HR 和招募顧問的 AI 助理。你的專長包括：

1. 職缺說明（JD）撰寫與優化
2. 人才畫像設計
3. 招募策略規劃
4. 面試問題設計
5. 履歷評估與篩選建議
6. 面試評估與決策支援

請以專業、友善、實用的方式回答問題，並提供具體可行的建議。如果使用者詢問的問題與招募相關，請盡量提供結構化的回答。`;

