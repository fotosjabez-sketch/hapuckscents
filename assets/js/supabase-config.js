/* =========================================================================
   HAPUCK SCENTS — conexão com o Supabase (config compartilhada)
   Usado tanto pela vitrine pública quanto pelo painel.

   A chave abaixo é a PUBLISHABLE (anon). Ela é feita para ficar visível no
   navegador — quem protege os dados são as regras de acesso (RLS) do banco:
   visitante só LÊ produtos publicados; criar/editar/excluir exige login.
   Nunca coloque aqui a service_role key.
   ========================================================================= */
window.HAPUCK_SUPABASE = {
  url: "https://mbwjxdajqtgpuyjexqyr.supabase.co",
  key: "sb_publishable_oM2McMeK6R6cROh3SSgTnA_aLcGeyRe",
  bucket: "produtos"
};

/* Cria o cliente uma única vez, se a biblioteca já tiver carregado. */
window.hapuckClient = (function () {
  if (!window.supabase || !window.supabase.createClient) return null;
  return window.supabase.createClient(
    window.HAPUCK_SUPABASE.url,
    window.HAPUCK_SUPABASE.key
  );
})();
