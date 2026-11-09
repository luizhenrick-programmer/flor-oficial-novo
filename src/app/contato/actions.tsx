"use server";

export type ContactState = {
  status: "idle" | "success" | "error";
  message: string;
  // devolvidos em caso de erro, para a pessoa não perder o que digitou
  values?: { name: string; email: string; message: string };
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SUCCESS = "Mensagem enviada! Responderemos em breve.";

export async function sendContact(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  // Campo escondido: pessoas não preenchem, robôs sim. Finge sucesso e descarta.
  if (String(formData.get("website") ?? "").trim() !== "") {
    return { status: "success", message: SUCCESS };
  }

  const values = {
    name: String(formData.get("name") ?? "").replace(/\s+/g, " ").trim(),
    email: String(formData.get("email") ?? "").trim(),
    message: String(formData.get("message") ?? "").trim(),
  };
  const fail = (message: string): ContactState => ({
    status: "error",
    message,
    values,
  });

  if (!values.name || values.name.length > 120) {
    return fail("Informe seu nome.");
  }
  if (!EMAIL.test(values.email) || values.email.length > 254) {
    return fail("Informe um e-mail válido.");
  }
  if (!values.message || values.message.length > 5000) {
    return fail("Escreva sua mensagem (até 5.000 caracteres).");
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL;

  if (!apiKey || !to || !from) {
    console.error("[contato] RESEND_API_KEY, CONTACT_TO_EMAIL ou CONTACT_FROM_EMAIL ausentes");
    return fail("Não foi possível enviar agora. Tente novamente mais tarde.");
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: to.split(",").map((e) => e.trim()),
        reply_to: values.email, // a loja responde direto para a cliente
        subject: `Contato pelo site: ${values.name}`,
        text: `Nome: ${values.name}\nE-mail: ${values.email}\n\n${values.message}`,
      }),
    });

    if (!res.ok) {
      console.error("[contato] Resend:", res.status, await res.text());
      return fail("Não foi possível enviar agora. Tente novamente mais tarde.");
    }
  } catch (err) {
    console.error("[contato] falha de rede:", err);
    return fail("Não foi possível enviar agora. Tente novamente mais tarde.");
  }

  return { status: "success", message: SUCCESS };
}
