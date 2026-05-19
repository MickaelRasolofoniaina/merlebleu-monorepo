import { Injectable } from '@angular/core';
import { Ingredient } from '@merlebleu/shared';
import { capitalizeFirstLetter } from '@shared/utils/text';

@Injectable({ providedIn: 'root' })
export class ReportGeneratorService {
  async generateShoppingList(ingredients: Ingredient[]): Promise<void> {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF();
    const today = new Date().toLocaleDateString('fr-FR');

    doc.setFontSize(16);
    doc.text('Liste des ingrédients à acheter', 14, 20);
    doc.setFontSize(10);
    doc.text(`Date : ${today}`, 14, 28);

    autoTable(doc, {
      startY: 35,
      head: [['Désignation', 'Catégorie', 'Stock restant']],
      body: ingredients.map((i) => [
        capitalizeFirstLetter(i.label),
        capitalizeFirstLetter(i.category.label),
        '0',
      ]),
      styles: { font: 'helvetica' },
      headStyles: { fillColor: [41, 128, 185] },
      columnStyles: { 2: { halign: 'right' } },
    });

    doc.save(`liste-ingredient-a-acheter-${today.replace(/\//g, '-')}.pdf`);
  }
}
