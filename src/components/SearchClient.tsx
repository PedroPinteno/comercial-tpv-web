// src/components/SearchClient.tsx
// Ignoramos tipos para no pelear con TypeScript con código DOM “puro”.
// Todo este código es prácticamente el mismo que tenías en <script type="module">.
// @ts-nocheck

import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function SearchClient() {
  useEffect(() => {
    console.log("[SearchClient] script loaded (SearchClient)");

    const $ = (s) => document.querySelector(s);

    const resultsEl = $("#results");
    const errorEl = $("#error");
    const qEl = $("#q");
    const btnSearch = $("#btnSearch");
    const logoutBtn = $("#logout");

    // Logout handler
    logoutBtn?.addEventListener("click", async () => {
      await supabase.auth.signOut();
      window.location.href = "/login";
    });

    // Parámetros de la URL
    const params = new URLSearchParams(window.location.search);
    const initialQ = params.get("q") || "";
    const category = params.get("c") || "";
    if (qEl) {
      qEl.value = initialQ;
    }

    function createCalcCard(title, type) {
      const wrap = document.createElement("div");
      wrap.style.border = "1px solid #e5e7eb";
      wrap.style.borderRadius = "12px";
      wrap.style.background = "#fff";
      wrap.style.padding = "16px";
      wrap.style.marginBottom = "12px";

      const h = document.createElement("h3");
      h.textContent = title;
      h.style.margin = "0 0 12px";

      const form = document.createElement("div");
      form.style.display = "grid";
      form.style.gridTemplateColumns = "repeat(auto-fill, minmax(140px, 1fr))";
      form.style.gap = "8px";

      const ancho = document.createElement("input");
      ancho.type = "number";
      ancho.placeholder = "Ancho (cm)";
      ancho.min = "0";

      const alto = document.createElement("input");
      alto.type = "number";
      alto.placeholder = "Alto (cm)";
      alto.min = "0";

      const galga = document.createElement("input");
      galga.type = "number";
      galga.placeholder = "Galga";
      galga.min = "0";

      const uds = document.createElement("input");
      uds.type = "number";
      uds.placeholder = "Unidades";
      uds.min = "1";

      const modalidad = document.createElement("select");
      modalidad.innerHTML =
        '<option value="anonima">Anónima</option><option value="impresa">Personalizada</option>';

      const tintasSel = document.createElement("select");
      tintasSel.innerHTML =
        '<option value="1">1 tinta</option><option value="2">2 tintas</option><option value="3">3 tintas</option>';
      tintasSel.style.display = "none";

      const carasSel = document.createElement("select");
      carasSel.innerHTML =
        '<option value="1">1 cara</option><option value="2">2 caras</option>';
      carasSel.style.display = "none";

      const btn = document.createElement("button");
      btn.className = "btn";
      btn.textContent = "Calcular";
      btn.style.width = "120px";

      const out = document.createElement("div");
      out.className = "price";
      out.style.marginTop = "8px";
      out.style.display = "none";

      if (type === "b_densidad" || type === "camiseta") {
        form.append(
          ancho,
          alto,
          galga,
          uds,
          modalidad,
          tintasSel,
          carasSel,
          btn
        );

        const togglePrintFields = () => {
          const isImpresa = modalidad.value === "impresa";
          tintasSel.style.display = isImpresa ? "" : "none";
          carasSel.style.display = isImpresa ? "" : "none";
        };
        modalidad.addEventListener("change", togglePrintFields);
        togglePrintFields();
      } else {
        form.append(ancho, alto, galga, uds, btn);
      }

      wrap.append(h, form, out);

      btn.addEventListener("click", async () => {
        out.style.display = "block";
        out.textContent = "Calculando…";
        try {
          const payload = {
            type,
            width_cm: Number(ancho.value || 0),
            height_cm: Number(alto.value || 0),
            gauge: Number(galga.value || 0),
            units: Number(uds.value || 0),
            print_type:
              type === "b_densidad" || type === "camiseta"
                ? modalidad.value || "anonima"
                : undefined,
            tintas:
              (type === "b_densidad" || type === "camiseta") &&
              modalidad.value === "impresa"
                ? Number(tintasSel.value || 1)
                : undefined,
            caras:
              (type === "b_densidad" || type === "camiseta") &&
              modalidad.value === "impresa"
                ? Number(carasSel.value || 1)
                : undefined,
          };

          const { data, error } = await supabase.functions.invoke(
            "calc-bag",
            { body: payload }
          );
          if (error) throw error;

          const kgTxt = (data.kg || 0).toFixed(3) + " kg";
          const priceTxt =
            (data.price_final?.toFixed
              ? data.price_final.toFixed(2)
              : data.price_final) +
            " " +
            (data.currency || "");
          out.textContent = `Kilos estimados: ${kgTxt} · Cotización: ${priceTxt}`;
        } catch (e) {
          out.textContent = "Error en el cálculo";
        }
      });

      return wrap;
    }

    function renderBagsCalc() {
      if (!resultsEl) return;
      resultsEl.innerHTML = "";
      const grid = document.createElement("div");
      grid.style.display = "grid";
      grid.style.gridTemplateColumns = "1fr";
      grid.style.gap = "12px";

      grid.append(
        createCalcCard("Camiseta", "camiseta"),
        createCalcCard("B.B. especiales", "bb_especiales"),
        createCalcCard("B. Densidad", "b_densidad")
      );
      resultsEl.appendChild(grid);
    }

    // Si la categoría es 'bags', activamos el modo cálculo en vez de la lista de resultados
    if (category === "bags") {
      renderBagsCalc();
    }

    function render(items) {
      if (!resultsEl) return;
      resultsEl.innerHTML = "";
      items.forEach((x) => {
        const row = document.createElement("div");
        row.className = "row";

        const left = document.createElement("div");
        const h4 = document.createElement("h4");
        h4.textContent = x.code ?? "";
        const ref = document.createElement("div");
        ref.className = "muted";
        ref.textContent = x.reference || "";
        left.append(h4, ref);

        const center = document.createElement("div");
        const nameDiv = document.createElement("div");
        nameDiv.textContent = x.name ?? "";
        const brandDiv = document.createElement("div");
        brandDiv.className = "muted";
        brandDiv.textContent = x.brand || "";
        center.append(nameDiv, brandDiv);

        const pvp = document.createElement("div");
        const pvpTxt = (x.pvp ?? 0).toFixed
          ? x.pvp.toFixed(2)
          : (x.pvp ?? "").toString();
        pvp.textContent = `${pvpTxt} ${x.currency || ""}`;

        const calc = document.createElement("div");
        calc.className = "calc";

        const qty = document.createElement("input");
        qty.type = "number";
        qty.min = "1";
        qty.value = "1";
        qty.style.width = "90px";

        const btn = document.createElement("button");
        btn.className = "btn";
        btn.textContent = "Calcular";

        const result = document.createElement("div");
        result.className = "price hidden";

        calc.append(qty, btn);
        row.append(left, center, pvp, calc);
        resultsEl.appendChild(row);
        resultsEl.appendChild(result);

        btn.addEventListener("click", async () => {
          result.classList.add("hidden");
          result.textContent = "Calculando…";
          try {
            const { data, error } = await supabase.functions.invoke(
              "get-price",
              {
                body: {
                  article_id: x.id,
                  qty: parseInt(qty.value || "1", 10),
                },
              }
            );
            if (error) throw error;
            const finalTxt =
              (data.price_final?.toFixed
                ? data.price_final.toFixed(2)
                : data.price_final) +
              " " +
              (data.currency || "");
            result.textContent = `Precio final: ${finalTxt}`;
            result.classList.remove("hidden");
          } catch (e) {
            result.textContent = "Error calculando precio";
            result.classList.remove("hidden");
          }
        });
      });
    }

    async function search(q) {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        window.location.href = "/login";
        return;
      }
      try {
        const body: any = { q, limit: 20 };
        if (category) body.category_id = category;
        const { data, error } = await supabase.functions.invoke(
          "search-article",
          { body }
        );
        if (error) throw error;
        render(data.items || []);
      } catch (e) {
        if (errorEl) {
          errorEl.textContent = "Error en la búsqueda";
          errorEl.classList.remove("hidden");
        }
      }
    }

    if (category === "bags") {
      // En modo Bolsas usamos las 3 cards de cálculo y no se hace búsqueda ni se muestra la barra
      document.querySelector(".search")?.classList.add("hidden");
    } else {
      btnSearch?.addEventListener("click", () => {
        if (!qEl) return;
        search(qEl.value);
      });
      if (initialQ) search(initialQ);
      else search("");
    }
  }, []);

  // No pintamos nada: este componente solo ejecuta la lógica en el cliente.
  return null;
}
