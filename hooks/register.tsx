import type { EngineInterface, Register } from 'claude-code'

const SYSTEM = `Bạn là chuyên gia viết câu lệnh (prompt) cho AI.
Viết lại câu lệnh thô của người dùng thành câu lệnh rõ ràng, đầy đủ, có cấu trúc, giữ nguyên ý định và ngôn ngữ gốc (mặc định tiếng Việt).
Nêu rõ: mục tiêu, bối cảnh, yêu cầu cụ thể, định dạng kết quả mong muốn, ràng buộc.
Không bịa thêm dữ kiện; chỗ thiếu thông tin thì ghi [cần bổ sung: ...].
Chỉ trả về câu lệnh đã viết lại, không giải thích, không mở đầu.`

let isBusy = false

async function rewrite($: EngineInterface) {
  if (isBusy) return
  const { text } = await $.prompt.read()
  const raw = text.trim()
  if (!raw) {
    $.ui.toast('Gõ câu lệnh thô vào ô nhập trước rồi bấm Master Prompt')
    return
  }
  isBusy = true
  $.ui.status('Master Prompt: đang viết lại…')
  try {
    const r = await $.model.complete({ model: 'sonnet', system: SYSTEM, prompt: raw })
    if (r.isAnswered && r.text.trim()) {
      await $.prompt.fill({ text: r.text.trim(), mode: 'replace' })
      $.ui.toast('Đã viết lại — xem lại rồi gửi')
    } else {
      $.ui.toast('Master Prompt chưa viết lại được, thử lại nhé')
    }
  } finally {
    isBusy = false
    $.ui.status(undefined)
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'mp', description: 'Master Prompt: viết lại câu lệnh đang gõ' })
    return next(e)
  })

  on('command.run', { command: 'mp' }, async ($, e, next) => {
    await rewrite($)
    return { text: '' }
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey || e.props.isWorking) return next(e)
    const { Box, Button } = $.ui.resolve(e)
    return (
      <Box>
        <Button label="✨ Master Prompt" onPress={() => rewrite($)} />
      </Box>
    )
  })
}
