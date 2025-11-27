import { StoryEncyclopedia } from '../types.ts';
import { marked } from 'marked';
import JSZip from 'jszip';
import { db } from '../db.ts';

const sanitizeForXhtml = (html: string): string => {
    return html
        .replace(/<br>/g, '<br />')
        .replace(/<hr>/g, '<hr />')
        .replace(/<img([^>]+)>/g, '<img$1 />');
};

export const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

export const handleExportStory = async (
    storyId: string,
    currentStory: StoryEncyclopedia | null,
    t: (key: string) => string,
    setToastMessage: (msg: string | null) => void,
    format: 'epub' | 'html' | 'txt' | 'json' | 'md' | 'pdf' = 'md'
) => {
    let story: StoryEncyclopedia | undefined;
    if (currentStory && currentStory.id === storyId) {
        story = currentStory;
    } else {
        story = await db.stories.get(storyId);
    }

    if (!story) return alert(t('dashboard.exportNotFound'));
    const safeTitle = story.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();

    if (format === 'json') {
        await db.backups.put({ storyId, lastWordCount: 999999999 });
        setToastMessage(null);
        downloadFile(JSON.stringify(story, null, 2), `${safeTitle}_backup.json`, 'application/json');
        return;
    }

    if (format === 'md') {
        const encData = { ...story };
        delete (encData as any).chapters;
        const chaptersMd = story.chapters.filter(c => c.type !== 'group_header').map(c => `## ${c.title}\n\n${c.content}`).join('\n\n<!-- CHAPTER_BREAK -->\n\n');
        downloadFile(`<!-- ENCYCLOPEDIA_JSON_START -->\n${JSON.stringify(encData, null, 2)}\n<!-- ENCYCLOPEDIA_JSON_END -->\n\n${chaptersMd}`, `${safeTitle}.md`, 'text/markdown;charset=utf-8');
        return;
    }

    if (format === 'txt') {
        const txt = story.chapters.filter(c => c.type !== 'group_header').map(c => `${c.title.toUpperCase()}\n\n${c.content.replace(/\*\*/g, '').replace(/^#+\s/gm, '')}`).join('\n\n' + '-'.repeat(20) + '\n\n');
        navigator.clipboard.writeText(txt).then(() => alert(t('export.copySuccess'))).catch(() => downloadFile(txt, `${safeTitle}.txt`, 'text/plain'));
        return;
    }

    if (format === 'html' || format === 'pdf' || format === 'epub') {
        const chaptersHtml = story.chapters.filter(c => c.type !== 'group_header').map(chap => `
            <div class="chapter">
                <h2>${chap.title}</h2>
                ${marked.parse(chap.content)}
            </div>
            <hr/>
        `).join('');

        const fullHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${story.title}</title>
                <style>
                    body { font-family: serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
                    h1, h2 { text-align: center; }
                    hr { border: 0; border-top: 1px solid #ccc; margin: 40px 0; }
                    p { margin-bottom: 1em; }
                    @media print { @page { margin: 2cm; } body { font-family: 'Times New Roman', serif; } }
                </style>
            </head>
            <body>
                <h1>${story.title}</h1>
                <p style="text-align:center;">By ${t('common.name')}</p>
                ${chaptersHtml}
            </body>
            </html>
        `;

        if (format === 'html') {
            downloadFile(fullHtml, `${safeTitle}.html`, 'text/html;charset=utf-8');
        } else if (format === 'pdf') {
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(fullHtml);
                printWindow.document.close();
                setTimeout(() => printWindow.print(), 500);
            } else { alert("Pop-up blocked"); }
        } else if (format === 'epub') {
            const zip = new JSZip();
            zip.file("mimetype", "application/epub+zip", { compression: "STORE" });
            zip.folder("META-INF")?.file("container.xml", `<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>`);
            const oebps = zip.folder("OEBPS");
            const epubChapters = story.chapters.filter(c => c.type !== 'group_header');
            if (oebps) {
                epubChapters.forEach((chap, i) => {
                    const xhtml = `<?xml version="1.0" encoding="utf-8"?><!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd"><html xmlns="http://www.w3.org/1999/xhtml"><head><title>${chap.title}</title></head><body><h2>${chap.title}</h2>${sanitizeForXhtml(marked.parse(chap.content) as string)}</body></html>`;
                    oebps.file(`chapter_${i}.xhtml`, xhtml);
                });
                const manifestItems = epubChapters.map((_, i) => `<item id="chapter_${i}" href="chapter_${i}.xhtml" media-type="application/xhtml+xml"/>`).join('\n');
                const spineItems = epubChapters.map((_, i) => `<itemref idref="chapter_${i}"/>`).join('\n');
                const opf = `<?xml version="1.0" encoding="utf-8"?><package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="2.0"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf"><dc:title>${story.title}</dc:title><dc:language>${story.language}</dc:language><dc:identifier id="BookId" opf:scheme="UUID">${story.id}</dc:identifier></metadata><manifest><item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>${manifestItems}</manifest><spine toc="ncx">${spineItems}</spine></package>`;
                oebps.file("content.opf", opf);
                const navPoints = epubChapters.map((chap, i) => `<navPoint id="navPoint-${i + 1}" playOrder="${i + 1}"><navLabel><text>${chap.title}</text></navLabel><content src="chapter_${i}.xhtml"/></navPoint>`).join('\n');
                const ncx = `<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE ncx PUBLIC "-//NISO//DTD ncx 2005-1//EN" "http://www.daisy.org/z3986/2005/ncx-2005-1.dtd"><ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1"><head><meta name="dtb:uid" content="${story.id}"/></head><docTitle><text>${story.title}</text></docTitle><navMap>${navPoints}</navMap></ncx>`;
                oebps.file("toc.ncx", ncx);
            }
            const content = await zip.generateAsync({ type: "blob", mimeType: "application/epub+zip" });
            const url = URL.createObjectURL(content);
            const a = document.createElement('a'); a.href = url; a.download = `${safeTitle}.epub`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
        }
    }
};
