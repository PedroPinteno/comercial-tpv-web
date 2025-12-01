// src/components/SearchClient.tsx
// DOM imperativo conservado para corresponder al markup actual. Se desactiva TS para no pelear con tipos del DOM.
// @ts-nocheck

import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function SearchClient() {
  useEffect(() => {
    const $ = (s) => document.querySelector(s);

    const resultsEl = $("#results");
    const errorEl = $("#error");
    const qEl = $("#q");
    const btnSearch = $("#btnSearch");
    const logoutBtn = $("#logout");
    const selectedCatEl = $("#selectedCategory");

    const logoutHandler = async () => {
      await supabase.auth.signOut();
      window.location.href = "/login";
    };

    logoutBtn?.addEventListener("click", logoutHandler);

    const params = new URLSearchParams(window.location.search);
    const initialQ = params.get("q") || "";
    const category = params.get("c") || "";
    const categoryName = params.get("name") || "";
    const fromLens = params.get("from") === "lens";
    const isBagCategory =
      category === "bags" ||
      categoryName.toLowerCase().includes("bolsa");

    if (qEl) {
      qEl.value = initialQ;
    }
    if (fromLens) {
      document.querySelector(".search")?.classList.add("reveal-search");
    }
    if (categoryName && selectedCatEl) {
      selectedCatEl.textContent = `Categoría seleccionada: ${categoryName}`;
      selectedCatEl.classList.remove("hidden");
    }

    function renderBagOptions() {
      if (!resultsEl) return;
      resultsEl.innerHTML = "";
      const grid = document.createElement("div");
      grid.className = "bag-grid";
      const options = [
        { title: "Camiseta" },
        { title: "Papel" },
        { title: "Vacío" },
      ];
      options.forEach((opt) => {
        const card = document.createElement("button");
        card.className = "bag-card";
        card.textContent = opt.title;
        card.addEventListener("click", () => {
          // Placeholder: navegación o lógica guiada pendiente
        });
        grid.appendChild(card);
      });
      resultsEl.appendChild(grid);
    }

    // Si la categoría es 'Bolsas', mostramos las 3 opciones guiadas
    if (isBagCategory) {
      resultsEl?.classList.add("bag-mode");
      renderBagOptions();
    }

    let hasSearched = isBagCategory;
    if (!hasSearched) {
      resultsEl?.classList.add("hidden");
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
        hasSearched = true;
        resultsEl?.classList.remove("hidden");
        render(data.items || []);
      } catch (e) {
        if (errorEl) {
          errorEl.textContent = "Error en la búsqueda";
          errorEl.classList.remove("hidden");
        }
      }
    }

    const searchHandler = () => {
      if (!qEl) return;
      search(qEl.value);
    };

    if (isBagCategory) {
      document.querySelector(".search")?.classList.add("hidden");
    } else {
      btnSearch?.addEventListener("click", searchHandler);
      if (initialQ) search(initialQ);
    }

    return () => {
      logoutBtn?.removeEventListener("click", logoutHandler);
      btnSearch?.removeEventListener("click", searchHandler);
    };
  }, []);

  return null;
}
