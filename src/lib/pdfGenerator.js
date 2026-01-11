import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatDateForDisplay } from './dateUtils';
import { computePairTotals } from './gameCalculations';
import { buildGameControlFigures } from './integrity';

const ANECDOTE_TYPE_LABELS = {
  text: 'Texto',
  image: 'Imagen',
  audio: 'Audio',
  video: 'Video',
};
const HEADER_HEIGHT = 30;
const CONTENT_TOP_PADDING = HEADER_HEIGHT + 15;
const CARD_GAP = 8;
const IMAGE_GALLERY_COLUMNS = 3;
const IMAGE_GALLERY_GAP = 6;
const IMAGE_GALLERY_HEIGHT = 60;
const numberFormatter = new Intl.NumberFormat('es-MX');

const VIDEO_PLACEHOLDER_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2b5876"/>
      <stop offset="100%" stop-color="#4e4376"/>
    </linearGradient>
  </defs>
  <rect width="800" height="450" fill="url(#grad)" rx="30"/>
  <circle cx="400" cy="225" r="70" fill="rgba(0,0,0,0.35)" />
  <polygon points="370,185 370,265 435,225" fill="#ffffff"/>
</svg>`;
let videoPlaceholderDataUrl;

const getVideoPlaceholderDataUrl = () => {
  if (!videoPlaceholderDataUrl) {
    videoPlaceholderDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(VIDEO_PLACEHOLDER_SVG)}`;
  }
  return videoPlaceholderDataUrl;
};

// Use same-origin asset to avoid CORS issues during PDF generation
// Place a PNG file at public/school-shield.png
const SCHOOL_SHIELD_URL = "/school-shield.png"; 

const imageDataUrlCache = new Map();

async function fetchImageBlob(url) {
  const response = await fetch(url, { mode: 'cors' });
  if (!response.ok) {
    throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
  }
  return await response.blob();
}

async function imageToDataUrl(url) {
  if (imageDataUrlCache.has(url)) return imageDataUrlCache.get(url);
  try {
    const blob = await fetchImageBlob(url);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        imageDataUrlCache.set(url, reader.result);
        resolve(reader.result);
      };
      reader.onerror = (error) => {
        console.error("FileReader error:", error);
        reject(error);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error fetching or processing image for PDF:", error);
    return null; 
  }
}

const getImageFormatFromDataUrl = (dataUrl) => {
  const match = /^data:image\/(png|jpeg|jpg|webp)/i.exec(dataUrl || "");
  if (!match) return 'PNG';
  const format = match[1].toUpperCase();
  return format === 'JPG' ? 'JPEG' : format;
};

const getImageDimensions = (dataUrl) => new Promise((resolve, reject) => {
  const img = new Image();
  img.onload = () => resolve({ width: img.width, height: img.height });
  img.onerror = (err) => reject(err);
  img.src = dataUrl;
});

const videoThumbnailCache = new Map();

const getYouTubeMeta = (url) => {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes('youtube') && !parsed.hostname.includes('youtu.be')) return null;
    let videoId = parsed.searchParams.get('v');
    if (parsed.hostname === 'youtu.be') {
      videoId = parsed.pathname.replace(/\//g, '');
    }
    if (!videoId && parsed.pathname.includes('/embed/')) {
      videoId = parsed.pathname.split('/').pop();
    }
    if (!videoId) return null;
    return {
      id: videoId,
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    };
  } catch {
    return null;
  }
};

const captureVideoFrameToDataUrl = (url) => {
  if (typeof document === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.preload = 'auto';
    video.muted = true;
    video.src = url;

    const cleanup = () => {
      video.pause();
      video.removeAttribute('src');
      video.load();
    };

    const finalize = (result) => {
      cleanup();
      resolve(result);
    };

    const timeout = setTimeout(() => finalize(null), 5000);

    const handleLoadedData = () => {
      try {
        const canvas = document.createElement('canvas');
        const width = video.videoWidth || 640;
        const height = video.videoHeight || 360;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/png');
        clearTimeout(timeout);
        finalize(dataUrl);
      } catch (error) {
        clearTimeout(timeout);
        finalize(null);
      }
    };

    video.addEventListener('loadeddata', handleLoadedData, { once: true });
    video.addEventListener('error', () => {
      clearTimeout(timeout);
      finalize(null);
    }, { once: true });
  });
};

const getVideoThumbnailDataUrl = async (url) => {
  if (!url) return getVideoPlaceholderDataUrl();
  if (videoThumbnailCache.has(url)) return videoThumbnailCache.get(url);
  try {
    const ytMeta = getYouTubeMeta(url);
    if (ytMeta) {
      const ytThumb = await imageToDataUrl(ytMeta.thumbnail);
      if (ytThumb) {
        videoThumbnailCache.set(url, ytThumb);
        return ytThumb;
      }
    }
    const captured = await captureVideoFrameToDataUrl(url);
    if (captured) {
      videoThumbnailCache.set(url, captured);
      return captured;
    }
  } catch (error) {
    console.warn('No se pudo crear miniatura de video para PDF:', error);
  }
  const placeholder = getVideoPlaceholderDataUrl();
  videoThumbnailCache.set(url, placeholder);
  return placeholder;
};

export const generateGameSummaryPDF = async (game, playersList, options = {}) => {
  if (!game || !playersList || !Array.isArray(playersList)) {
    console.error("Invalid game data or playersList for PDF generation.");
    throw new Error("Datos inválidos para generar PDF.");
  }

  const attendanceRecords = Array.isArray(options?.attendance) ? options.attendance : [];
  const controlFigures = buildGameControlFigures(game, attendanceRecords);

  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;
  const margin = 15;
  let yPos = CONTENT_TOP_PADDING;

  const shieldDataUrl = await imageToDataUrl(SCHOOL_SHIELD_URL);
  if (!shieldDataUrl) {
    console.warn("Could not load school shield for PDF, continuing without it.");
  }

  const getCurrentPageInfo = () => {
    const internal = /** @type {any} */ (doc.internal);
    if (internal && typeof internal.getCurrentPageInfo === 'function') {
      return internal.getCurrentPageInfo();
    }
    return null;
  };

  const addPageHeader = () => {
    const currentPageInfo = getCurrentPageInfo();
    const pageNumber = currentPageInfo?.pageNumber || doc.getNumberOfPages();
    doc.setFillColor(25, 41, 79);
    doc.rect(0, 0, pageWidth, HEADER_HEIGHT, 'F');
    if (shieldDataUrl) {
      doc.addImage(shieldDataUrl, 'PNG', pageWidth - margin - 18, 6, 16, 16);
    }
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text('Resumen de la Velada - Dominó CUM Gen 74', margin, 14);
    doc.setFontSize(10.5);
    doc.text(`Fecha: ${formatDateForDisplay(game.date)}`, margin, HEADER_HEIGHT - 8);
    doc.text(`Página ${pageNumber}`, pageWidth - margin, HEADER_HEIGHT - 8, { align: 'right' });
    doc.setTextColor(34, 34, 34);
    doc.setDrawColor(64, 78, 120);
    doc.setLineWidth(0.4);
    doc.line(margin, HEADER_HEIGHT - 4, pageWidth - margin, HEADER_HEIGHT - 4);
  };

  const resetYPos = () => {
    yPos = CONTENT_TOP_PADDING;
  };

  const startNewPage = () => {
    doc.addPage();
    addPageHeader();
    resetYPos();
  };

  const ensureSpace = (needed = 0) => {
    if (yPos + needed > pageHeight - margin) {
      startNewPage();
    }
  };

  const drawSectionTitle = (label) => {
    ensureSpace(14);
    doc.setFontSize(13);
    doc.setTextColor(25, 33, 52);
    doc.text(label, margin, yPos);
    doc.setDrawColor(199, 210, 254);
    doc.setLineWidth(0.4);
    doc.line(margin, yPos + 2, pageWidth - margin, yPos + 2);
    yPos += 7;
    doc.setTextColor(48, 55, 65);
  };

  addPageHeader();

  const formatControlValue = (value, unit) => {
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value === 'number') {
      const formatted = numberFormatter.format(Math.round(value));
      return unit ? `${formatted} ${unit}` : formatted;
    }
    return String(value);
  };

  const getPlayerNickname = (playerId) => {
    if (playerId === null || playerId === undefined) return 'Desconocido';
    const player = playersList.find(p => String(p.id) === String(playerId));
    return player ? player.nickname : `Desconocido #${playerId}`;
  };

  const ensurePlayerStatsEntry = (playerId) => {
    if (playerId === null || playerId === undefined) return null;
    if (!gamePlayersStats[playerId]) {
      gamePlayersStats[playerId] = {
        id: playerId,
        nickname: getPlayerNickname(playerId),
        partidasPlayed: 0,
        partidasWonInTables: 0,
        handsPlayed: 0,
        pointsAccumulated: 0,
      };
    }
    return gamePlayersStats[playerId];
  };
  
  if (game.summary) {
    const summaryLines = doc.splitTextToSize(game.summary, pageWidth - margin * 2 - 6);
    const summaryHeight = (summaryLines.length * 4) + 16;
    ensureSpace(summaryHeight + CARD_GAP);
    doc.setFillColor(243, 248, 255);
    doc.setDrawColor(208, 219, 240);
    doc.roundedRect(margin, yPos, pageWidth - margin * 2, summaryHeight, 4, 4, 'FD');
    doc.setFontSize(11);
    doc.setTextColor(25, 42, 86);
    doc.text('Resumen General', margin + 4, yPos + 6);
    doc.setTextColor(58, 69, 94);
    doc.setFontSize(10);
    doc.text(summaryLines, margin + 4, yPos + 12);
    yPos += summaryHeight + CARD_GAP;
    doc.setTextColor(48, 55, 65);
  }

  if (controlFigures) {
    const controlRows = [
      { label: 'Mesas registradas', value: controlFigures.totalTables },
      { label: 'Mesas finalizadas', value: controlFigures.finishedTables },
      { label: 'Mesas activas', value: controlFigures.activeTables },
      { label: 'Mesas canceladas', value: controlFigures.cancelledTables },
      { label: 'Manos registradas', value: controlFigures.totalHands },
      { label: 'Partidas declaradas', value: controlFigures.partidasRegistradas },
      { label: 'Jugadores únicos', value: controlFigures.uniquePlayers },
      { label: 'Puntos registrados', value: controlFigures.totalPoints },
      { label: 'Código de control', value: controlFigures.controlCode },
    ];
    const cardHeight = 18 + (controlRows.length * 6);
    ensureSpace(cardHeight + CARD_GAP + 6);
    doc.setFillColor(249, 250, 255);
    doc.setDrawColor(215, 225, 245);
    doc.roundedRect(margin, yPos, pageWidth - margin * 2, cardHeight, 4, 4, 'FD');
    doc.setFontSize(11);
    doc.setTextColor(25, 42, 86);
    doc.text('Cifras de control', margin + 4, yPos + 6);
    doc.setFontSize(9.5);
    doc.setTextColor(60, 68, 92);
    let rowY = yPos + 12;
    controlRows.forEach(({ label, value, unit }) => {
      doc.text(label, margin + 4, rowY);
      doc.text(formatControlValue(value, unit), pageWidth - margin - 4, rowY, { align: 'right' });
      rowY += 6;
    });
    yPos += cardHeight + CARD_GAP;
    doc.setTextColor(48, 55, 65);
  }

  const gamePlayersStats = {};
  playersList.forEach(p => {
    gamePlayersStats[p.id] = {
      id: p.id,
      nickname: p.nickname,
      partidasPlayed: 0,
      partidasWonInTables: 0,
      handsPlayed: 0,
      handsWon: 0,
      pointsAccumulated: 0
    };
  });

  let totalHandsInVelada = 0;
  const gamePairStatsMap = new Map();

  if (game.tables && Array.isArray(game.tables)) {
    game.tables.forEach(table => {
      if (!table || !table.pairs || !Array.isArray(table.pairs) || !table.hands || !Array.isArray(table.hands)) {
        console.warn("Skipping malformed table in PDF generation:", table);
        return;
      }

      const { hands: safeHands, pair1: safePair1, pair2: safePair2 } = computePairTotals(table);
      totalHandsInVelada += safeHands.length;
      const playersInThisTable = new Set();

      // Calcular puntos y partidas ganadas por pareja desde las manos
      const pairPoints = {
        0: safePair1,
        1: safePair2,
      };
      const pairGamesWon = {
        0: table.games_won_pair1 || 0,
        1: table.games_won_pair2 || 0,
      };
      const pairHandsWon = { 0: 0, 1: 0 };
      safeHands.forEach(hand => {
        const p1 = hand?.pair_1_score || 0;
        const p2 = hand?.pair_2_score || 0;
        if (p1 > p2) pairHandsWon[0] += 1;
        else if (p2 > p1) pairHandsWon[1] += 1;
      });

      const pair1GamesWon = table.games_won_pair1 || 0;
      const pair2GamesWon = table.games_won_pair2 || 0;
      const partidasTerminadas = pair1GamesWon + pair2GamesWon;
      const isTableFinished = !!(table.partidaFinished ?? table.partida_finished);
      const hayPartidaEnCurso = !isTableFinished && safeHands.length > 0 ? 1 : 0;
      const partidasJugadasMesa = partidasTerminadas + hayPartidaEnCurso;

      table.pairs.forEach((pair, pairIndex) => {
        if (!pair || !pair.players || !Array.isArray(pair.players)) return;
        const pointsForThisPair = pairPoints[pairIndex] || 0;
        const gamesWonByPair = pairGamesWon[pairIndex] || 0;
        const handsWonByPair = pairHandsWon[pairIndex] || 0;
        pair.players.forEach(pId => {
          const statsEntry = ensurePlayerStatsEntry(pId);
          if (statsEntry) {
            playersInThisTable.add(pId);
            statsEntry.pointsAccumulated += pointsForThisPair;
            statsEntry.partidasWonInTables += gamesWonByPair;
            statsEntry.partidasPlayed += partidasJugadasMesa;
            statsEntry.handsWon += handsWonByPair;
          }
        });
      });
      
      playersInThisTable.forEach(pId => {
        const statsEntry = ensurePlayerStatsEntry(pId);
        if (statsEntry) {
          statsEntry.handsPlayed += safeHands.length;
        }
      });
      
      table.pairs.forEach((pair, pairIndex) => {

        const normalizedPlayers = [...pair.players].map(p => String(p ?? '')).sort((a, b) => a.localeCompare(b));
        const pairKey = normalizedPlayers.join('-');
        if (!gamePairStatsMap.has(pairKey)) {
            gamePairStatsMap.set(pairKey, {
            playersDisplay: pair.players.map(getPlayerNickname).join(' y '),
            partidasPlayed: 0,
            totalPointsInPartidas: 0,
            totalGamesWonInTables: 0,
            totalHandsWon: 0,
            });
        }
        const stats = gamePairStatsMap.get(pairKey);
        stats.partidasPlayed += partidasJugadasMesa;
        // Sumar puntos acumulados por partidas desde manos
        stats.totalPointsInPartidas += (pairIndex === 0 ? pairPoints[0] : pairPoints[1]); 
        stats.totalGamesWonInTables += (pairIndex === 0 ? (table.games_won_pair1 || 0) : (table.games_won_pair2 || 0));
        stats.totalHandsWon += (pairIndex === 0 ? pairHandsWon[0] : pairHandsWon[1]);
      });
    });
  }

  // Snapshots eliminados: no se agregan puntos históricos para evitar duplicar totales


  drawSectionTitle('Estadísticas de la Velada');
  doc.setFontSize(10);
  doc.text(`Total de Manos Jugadas en la Velada: ${totalHandsInVelada}`, margin, yPos);
  yPos += 6;
  
  const playerStatsBody = Object.values(gamePlayersStats)
    .filter(p => p.partidasPlayed > 0) 
    .map(p => [p.nickname, p.partidasPlayed, p.partidasWonInTables, p.handsPlayed, p.handsWon, p.pointsAccumulated]);

  if (playerStatsBody.length > 0) {
    ensureSpace(20);
    /** @type {any} */ (doc).autoTable({
      startY: yPos,
      head: [['Jugador', 'Partidas Jugadas', 'Partidas Ganadas', 'Manos Jugadas', 'Manos Ganadas', 'Puntos Acum.']],
      body: playerStatsBody,
      theme: 'striped',
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [22, 160, 133], textColor: 255, fontStyle: 'bold' },
      margin: { left: margin, right: margin, top: CONTENT_TOP_PADDING },
      didDrawPage: () => addPageHeader(),
    });
    yPos = /** @type {any} */ (doc).lastAutoTable.finalY + 8;
    ensureSpace(10);
  }


  const pairStatsBody = Array.from(gamePairStatsMap.values())
    .filter(p => p.partidasPlayed > 0)
    .map(p => [p.playersDisplay, p.partidasPlayed, p.totalGamesWonInTables, p.totalHandsWon, p.totalPointsInPartidas]);
  
  if (pairStatsBody.length > 0) {
    drawSectionTitle('Estadísticas por Pareja en la Velada');
    ensureSpace(20);
    /** @type {any} */ (doc).autoTable({
      startY: yPos,
      head: [['Pareja', 'Partidas Jugadas', 'Partidas Ganadas', 'Manos Ganadas', 'Puntos Acum.']],
      body: pairStatsBody,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
      margin: { left: margin, right: margin, top: CONTENT_TOP_PADDING },
      didDrawPage: () => addPageHeader(),
    });
    yPos = /** @type {any} */ (doc).lastAutoTable.finalY + 8;
    ensureSpace(10);
  }
  
  if (game.anecdotes && Array.isArray(game.anecdotes) && game.anecdotes.length > 0) {
    drawSectionTitle('Anécdotas de la Velada');
    doc.setFontSize(10);
    const cardWidth = pageWidth - margin * 2;
    const cardPadding = 6;
    const innerWidth = cardWidth - cardPadding * 2;
    const imageGalleryEntries = [];
    const narrativeEntries = [];

    for (const anecdote of game.anecdotes) {
      if (!anecdote || !anecdote.date) continue;
      const hasText = typeof anecdote.text === 'string' && anecdote.text.trim().length > 0;
      const hasMediaUrl = anecdote.mediaUrl && anecdote.mediaUrl.trim().length > 0;
      if (!hasText && !hasMediaUrl) continue;

      const type = anecdote.mediaType || 'text';
      const anecdoteDate = formatDateForDisplay(anecdote.date);
      const textLines = hasText ? doc.splitTextToSize(anecdote.text.trim(), innerWidth) : [];

      if (type === 'image' && hasMediaUrl) {
        try {
          const dataUrl = await imageToDataUrl(anecdote.mediaUrl.trim());
          if (dataUrl) {
            const { width: imgWidth, height: imgHeight } = await getImageDimensions(dataUrl);
            const captionLines = textLines.slice(0, 2);
            imageGalleryEntries.push({
              label: `[${anecdoteDate}] ${ANECDOTE_TYPE_LABELS[type] || ''}`.trim(),
              captionLines,
              dataUrl,
              format: getImageFormatFromDataUrl(dataUrl),
              rawWidth: imgWidth,
              rawHeight: imgHeight,
            });
            continue;
          }
        } catch (err) {
          console.warn('No se pudo preparar imagen para la galería, se usará enlace:', err);
        }
      }

      let mediaDescriptor = null;
      if (type === 'video' && hasMediaUrl) {
        try {
          const thumbUrl = await getVideoThumbnailDataUrl(anecdote.mediaUrl.trim());
          if (thumbUrl) {
            const { width: thumbW, height: thumbH } = await getImageDimensions(thumbUrl);
            const maxWidth = innerWidth;
            const ratio = Math.min(maxWidth / thumbW, 60 / thumbH, 1);
            mediaDescriptor = {
              kind: 'video',
              dataUrl: thumbUrl,
              format: getImageFormatFromDataUrl(thumbUrl),
              width: thumbW * ratio,
              height: thumbH * ratio,
            };
          }
        } catch (err) {
          console.warn('No se pudo generar miniatura de video, se deja placeholder:', err);
        }
      }

      const hasLinkFallback = (!mediaDescriptor && type !== 'text' && hasMediaUrl) || type === 'video';
      narrativeEntries.push({
        label: `[${anecdoteDate}] ${ANECDOTE_TYPE_LABELS[type] || ''}`.trim(),
        textLines,
        mediaDescriptor,
        hasLinkFallback,
        url: anecdote.mediaUrl,
        type,
      });
    }

    const renderImageGallery = () => {
      if (imageGalleryEntries.length === 0) return;
      const cellWidth = (cardWidth - IMAGE_GALLERY_GAP * (IMAGE_GALLERY_COLUMNS - 1)) / IMAGE_GALLERY_COLUMNS;
      const cellHeight = IMAGE_GALLERY_HEIGHT + 18;
      let column = 0;
      for (let i = 0; i < imageGalleryEntries.length; i += 1) {
        if (column === 0) {
          ensureSpace(cellHeight);
        }
        const entry = imageGalleryEntries[i];
        const cellX = margin + column * (cellWidth + IMAGE_GALLERY_GAP);
        const cellY = yPos;

        doc.setFillColor(249, 250, 251);
        doc.setDrawColor(229, 231, 235);
        doc.roundedRect(cellX, cellY, cellWidth, cellHeight, 3, 3, 'S');

        const imageY = cellY + 4;
        const availableHeight = IMAGE_GALLERY_HEIGHT;
        const ratio = Math.min(cellWidth / entry.rawWidth, availableHeight / entry.rawHeight);
        const renderWidth = entry.rawWidth * ratio;
        const renderHeight = entry.rawHeight * ratio;
        const imageX = cellX + (cellWidth - renderWidth) / 2;
        const centeredY = imageY + (availableHeight - renderHeight) / 2;
        doc.addImage(entry.dataUrl, entry.format, imageX, centeredY, renderWidth, renderHeight);

        doc.setFontSize(8.5);
        doc.setTextColor(31, 41, 55);
        doc.text(entry.label, cellX + 2, cellY + cellHeight - 6);
        if (entry.captionLines.length > 0) {
          doc.setFontSize(8);
          doc.setTextColor(107, 114, 128);
          doc.text(entry.captionLines.slice(0, 2), cellX + 2, cellY + cellHeight - 2);
        }

        column += 1;
        if (column === IMAGE_GALLERY_COLUMNS || i === imageGalleryEntries.length - 1) {
          yPos += cellHeight + IMAGE_GALLERY_GAP;
          column = 0;
        }
      }
      yPos += CARD_GAP;
      doc.setTextColor(48, 55, 65);
    };

    const renderNarrativeEntries = () => {
      for (const entry of narrativeEntries) {
        const textHeight = entry.textLines.length ? (entry.textLines.length * 4) + 4 : 0;
        const mediaHeight = entry.mediaDescriptor ? entry.mediaDescriptor.height + 8 : 0;
        const linkHeight = entry.hasLinkFallback ? 8 : 0;
        const cardHeight = cardPadding * 2 + 10 + textHeight + mediaHeight + linkHeight;

        ensureSpace(cardHeight + CARD_GAP);
        doc.setFillColor(252, 252, 255);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(margin, yPos, cardWidth, cardHeight, 4, 4, 'FD');

        let innerY = yPos + cardPadding + 6;
        const innerX = margin + cardPadding;
        doc.setFontSize(11);
        doc.setTextColor(17, 24, 39);
        doc.text(entry.label, innerX, innerY);
        innerY += 4;
        doc.setFontSize(10);
        doc.setTextColor(71, 85, 105);

        if (entry.textLines.length > 0) {
          doc.text(entry.textLines, innerX, innerY);
          innerY += (entry.textLines.length * 4) + 2;
        }

        if (entry.mediaDescriptor) {
          doc.addImage(entry.mediaDescriptor.dataUrl, entry.mediaDescriptor.format, innerX, innerY, entry.mediaDescriptor.width, entry.mediaDescriptor.height);
          innerY += entry.mediaDescriptor.height + 4;
        }

        if (entry.hasLinkFallback && entry.url) {
          doc.setTextColor(79, 70, 229);
          const label = entry.type === 'video' ? 'Abrir video' : entry.type === 'audio' ? 'Escuchar audio' : 'Abrir archivo';
          doc.textWithLink(label, innerX, innerY, { url: entry.url });
          innerY += 4;
          doc.setTextColor(71, 85, 105);
        }

        yPos += cardHeight + CARD_GAP;
        doc.setTextColor(48, 55, 65);
      }
    };

    renderImageGallery();
    renderNarrativeEntries();
  }

  const filename = `Resumen_Velada_${game.date ? game.date.replace(/-/g, '_') : 'fecha_desconocida'}.pdf`;
  doc.save(filename);
};