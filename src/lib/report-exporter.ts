
'use client';

import html2canvas from 'html2canvas';

// This function is designed to be called from a client component.
export const exportReportToJpg = async (
    reportRef: React.RefObject<HTMLDivElement>,
    fileName: string,
    authorName: string
): Promise<void> => {
    const reportElement = reportRef.current;
    if (!reportElement) {
        throw new Error("Element Laporan tidak ditemukan.");
    }

    const getBgColor = (el: HTMLElement | null) => {
        if (!el) return '#ffffff'; // Default to white
        return window.getComputedStyle(el).backgroundColor;
    };

    const clonedElement = reportElement.cloneNode(true) as HTMLElement;
    
    // The cloned element will be our direct render target.
    // It's placed off-screen to be rendered without affecting the current view.
    clonedElement.style.position = 'absolute';
    clonedElement.style.left = '-9999px';
    clonedElement.style.top = '0px';
    clonedElement.style.color = '#1A1A1A';
    // Use a fixed wide width to ensure all content fits.
    clonedElement.style.width = '800px'; 
    
    document.body.appendChild(clonedElement);

    const tableElement = clonedElement.querySelector('table');
    if (tableElement) {
        tableElement.style.tableLayout = 'auto';
        tableElement.style.width = '100%';
    }

    const textareaToReplace = clonedElement.querySelector('#catatan-export');
    if (textareaToReplace) {
        const replacementDiv = document.createElement('div');
        replacementDiv.textContent = (textareaToReplace as HTMLTextAreaElement).value.toUpperCase();
        replacementDiv.style.width = '100%';
        replacementDiv.style.textAlign = 'center';
        replacementDiv.style.fontWeight = '700';
        replacementDiv.style.fontSize = '1.5rem';
        replacementDiv.style.letterSpacing = '0.05em';
        replacementDiv.style.marginBottom = '1rem';
        replacementDiv.style.color = '#1A1A1A';
        textareaToReplace.parentNode?.replaceChild(replacementDiv, textareaToReplace);
    } else {
        const titleElement = clonedElement.querySelector('#report-title');
        const authorElement = clonedElement.querySelector('#author-name');
        if (authorElement) (authorElement as HTMLElement).style.color = '#1A1A1A';
        if (titleElement) (titleElement as HTMLElement).style.color = '#1A1A1A';
    }
    
    clonedElement.querySelectorAll('.export-card').forEach((cardEl, index) => {
        const originalCard = reportElement.querySelectorAll('.export-card')[index];
        if (originalCard) {
            (cardEl as HTMLElement).style.backgroundColor = getBgColor(originalCard as HTMLElement);
            (cardEl as HTMLElement).style.color = window.getComputedStyle(originalCard as HTMLElement).color;
        }
    });
    
    clonedElement.querySelectorAll('tbody tr').forEach((originalRow, rowIndex) => {
        const clonedRow = clonedElement.querySelectorAll('tbody tr')[rowIndex];
        if (!clonedRow) return;

        // Align all cells to middle
        clonedRow.querySelectorAll('td').forEach(td => {
            (td as HTMLElement).style.verticalAlign = 'middle';
            (td as HTMLElement).style.textAlign = 'center';
        });

        const originalTextarea = originalRow.querySelector('textarea.keterangan-input') as HTMLTextAreaElement;
        const clonedCell = clonedRow.querySelector('td:last-child');
        
        if (originalTextarea && clonedCell) {
            const value = originalTextarea.value || '-';
            clonedCell.innerHTML = `<div style="text-align: center; vertical-align: middle;">${value}</div>`;
            const cellStyle = (clonedCell as HTMLElement).style;
            cellStyle.whiteSpace = 'normal';
            cellStyle.wordBreak = 'break-word';
        }
    });

    clonedElement.querySelectorAll('span[data-status-text]').forEach(textSpan => {
        const status = textSpan.getAttribute('data-status-value') || 'DEFAULT';
        const originalBadge = reportElement.querySelector(`span[data-status-value="${status}"]`) ?? reportElement.querySelector(`[class*="bg-gray-200"]`);
        
        const replacementDiv = document.createElement('div');
        replacementDiv.textContent = status.replace(/_/g, ' ');
        replacementDiv.style.display = 'inline-block';
        replacementDiv.style.padding = '0.25rem 0.75rem';
        replacementDiv.style.fontSize = '0.75rem';
        replacementDiv.style.fontWeight = '600';
        replacementDiv.style.borderRadius = '9999px';
        replacementDiv.style.textTransform = 'uppercase';
        replacementDiv.style.lineHeight = '1';
        replacementDiv.style.verticalAlign = 'middle';
        replacementDiv.style.margin = 'auto'; // Center badge if it's the only thing in the cell

        if (originalBadge) {
          replacementDiv.style.backgroundColor = getBgColor(originalBadge as HTMLElement);
          replacementDiv.style.color = window.getComputedStyle(originalBadge as HTMLElement).color;
        } else {
           replacementDiv.style.backgroundColor = '#E5E7EB';
           replacementDiv.style.color = '#1F2937';
        }

        textSpan.parentNode?.replaceChild(replacementDiv, textSpan);
    });
    
    clonedElement.querySelectorAll('tbody tr').forEach((row, index) => {
      if (index % 2 !== 0) {
        (row as HTMLElement).style.backgroundColor = 'rgba(0, 0, 0, 0.03)';
      }
    });

    const footer = document.createElement('div');
    footer.textContent = 'auto generate by teamrewang.xyz';
    footer.style.textAlign = 'center';
    footer.style.fontSize = '0.75rem';
    footer.style.marginTop = '1rem';
    footer.style.color = '#71717a';
    clonedElement.appendChild(footer);

    return new Promise((resolve, reject) => {
        setTimeout(async () => {
            try {
                // Now render the container, which holds the centered clone
                const canvas = await html2canvas(clonedElement, {
                    scale: 2,
                    useCORS: true,
                    allowTaint: true,
                    // Critical for preserving rounded corners on the card itself
                    backgroundColor: null,
                });
                
                const link = document.createElement('a');
                link.download = fileName;
                link.href = canvas.toDataURL("image/jpeg", 0.95);
                link.click();
                
                resolve();

            } catch (error) {
                console.error("Error exporting to JPG:", error);
                reject(error);
            } finally {
                document.body.removeChild(clonedElement);
            }
        }, 300);
    });
};
