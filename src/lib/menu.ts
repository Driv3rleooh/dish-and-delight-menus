export type Item = { id: string; name: string; desc: string; price: string; image?: string | undefined };
export type Section = { id: string; title: string; items: Item[] };
export type Menu = { template: string; name: string; tagline: string; footer: string; sections: Section[] };

export const uid = () => Math.random().toString(36).slice(2, 10);
const it = (name: string, desc: string, price: string): Item => ({ id: uid(), name, desc, price });
const sec = (title: string, items: Item[]): Section => ({ id: uid(), title, items });

export const TEMPLATES: { id: string; label: string; kind: string; make: () => Menu }[] = [
  { id: "bistro", label: "Bistrô", kind: "Restaurante", make: () => ({ template: "bistro", name: "Bistrô Aurora", tagline: "Cozinha de estação", footer: "Aberto de terça a domingo · 12h às 23h", sections: [
    sec("Entradas", [it("Burrata com tomates", "Tomates confitados, manjericão e azeite", "R$ 48"), it("Carpaccio", "Alcaparras, parmesão e rúcula", "R$ 42")]),
    sec("Principais", [it("Risoto de cogumelos", "Arbóreo, funghi secchi e trufa", "R$ 78"), it("Peixe do dia", "Purê de mandioquinha e beurre blanc", "R$ 89")]),
    sec("Sobremesas", [it("Pudim de leite", "Calda de caramelo", "R$ 24")]) ] }) },
  { id: "cafe", label: "Café", kind: "Cafeteria / padaria", make: () => ({ template: "cafe", name: "Café do Bairro", tagline: "Feito com carinho", footer: "Wi-fi: cafedobairro", sections: [
    sec("Cafés", [it("Espresso", "Grãos especiais torrados aqui", "R$ 7"), it("Cappuccino", "Leite vaporizado e canela", "R$ 12")]),
    sec("Para comer", [it("Pão de queijo", "Porção com 6 unidades", "R$ 14"), it("Croissant", "Manteiga francesa", "R$ 11")]) ] }) },
  { id: "burger", label: "Lanchonete", kind: "Hamburgueria / fast food", make: () => ({ template: "burger", name: "BRASA BURGER", tagline: "Smash na chapa", footer: "Peça pelo WhatsApp (11) 99999-0000", sections: [
    sec("Burgers", [it("Clássico", "Blend 120g, cheddar, picles", "R$ 29"), it("Bacon duplo", "2x blend, bacon crocante, molho da casa", "R$ 39")]),
    sec("Acompanhamentos", [it("Fritas", "Com páprica defumada", "R$ 15")]),
    sec("Bebidas", [it("Refrigerante lata", "350ml", "R$ 7")]) ] }) },
  { id: "bar", label: "Bar", kind: "Bar / drinks", make: () => ({ template: "bar", name: "Taverna Verde", tagline: "Drinks & petiscos", footer: "Happy hour de seg a sex, 17h às 20h", sections: [
    sec("Drinks", [it("Negroni", "Gin, Campari e vermute", "R$ 36"), it("Caipirinha", "Limão, cachaça artesanal", "R$ 26")]),
    sec("Petiscos", [it("Bolinho de bacalhau", "6 unidades", "R$ 38")]) ] }) },
  { id: "fresh", label: "Natural", kind: "Saudável / açaí / eventos", make: () => ({ template: "fresh", name: "Verde Vivo", tagline: "Comida de verdade", footer: "Opções veganas sinalizadas", sections: [
    sec("Bowls", [it("Bowl tropical", "Açaí, banana, granola e mel", "R$ 25"), it("Poke salmão", "Arroz, salmão, manga, edamame", "R$ 44")]),
    sec("Sucos", [it("Verde detox", "Couve, limão, gengibre e maçã", "R$ 14")]) ] }) },
  { id: "blank", label: "Em branco", kind: "Comece do zero", make: () => ({ template: "bistro", name: "Meu Cardápio", tagline: "", footer: "", sections: [sec("Nova seção", [it("Novo item", "Descrição", "R$ 0")])] }) },
];
