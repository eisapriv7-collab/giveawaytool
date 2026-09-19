/**
 * UIManager
 * Manages the high-end gaming interface, glassmorphic panels,
 * participant lists, chat feed, cryptographic audit logs, modals, and toasts.
 */
export class UIManager {
  constructor({ participantManager, gameManager, kickChatManager, randomManager, audioManager, leaderboardManager }) {
    this.participantManager = participantManager;
    this.gameManager = gameManager;
    this.kickChatManager = kickChatManager;
    this.randomManager = randomManager;
    this.audioManager = audioManager;
    this.leaderboardManager = leaderboardManager;

    this.activeTab = 'participants'; // 'participants' | 'chat' | 'audit' | 'history'
    this.participantFilter = 'ALL'; // 'ALL' | 'ALIVE' | 'ELIMINATED'
    this.searchQuery = '';

    this._cacheDOMElements();
    this._bindEvents();
    this._renderAll();
  }

  _renderAll() {
    this._renderLobbyGames();
    this._renderGameSelector();
    this._updateParticipantsView();
    this._updateAuditLogView();
    this._updateHistoryView();
    this._updateHeaderBadges();
    this._updateControlButtons();
  }

  _cacheDOMElements() {
    // Header
    this.chatStatusBadge = document.getElementById('header-chat-status');
    this.participantCountBadge = document.getElementById('header-player-count');
    this.btnMuteToggle = document.getElementById('btn-mute-toggle');
    this.btnConfigChat = document.getElementById('btn-config-chat');
    this.btnDebugModal = document.getElementById('btn-debug-modal');

    // Main Views
    this.lobbyView = document.getElementById('lobby-view');
    this.gameCanvasContainer = document.getElementById('game-canvas-container');
    this.winnerModal = document.getElementById('winner-modal');
    this.winnerTitleEl = document.getElementById('winner-title');
    this.winnerGameBadgeEl = document.getElementById('winner-game-badge');
    this.btnCloseWinnerModal = document.getElementById('btn-close-winner-modal');

    // Lobby Games Grid & Category Tabs
    this.lobbyGamesGrid = document.getElementById('lobby-games-grid');
    this.categoryTabs = document.querySelectorAll('.category-tab-btn');
    this.categorySubtitle = document.getElementById('minigames-subtitle');

    // Control Bar
    this.btnStartGame = document.getElementById('btn-start-game');
    this.btnStopGame = document.getElementById('btn-stop-game');
    this.btnSkipRound = document.getElementById('btn-skip-round');
    this.btnResetGame = document.getElementById('btn-reset-game');
    this.lblGameName = document.getElementById('lbl-game-name');
    this.lblPlayersCount = document.getElementById('lbl-players-count');
    this.lblDuration = document.getElementById('lbl-duration');
    this.gameSelectorBar = document.getElementById('game-selector-bar');

    // Sidebar Tabs
    this.tabButtons = document.querySelectorAll('.sidebar-tab-btn');
    this.tabPanels = {
      participants: document.getElementById('panel-participants'),
      chat: document.getElementById('panel-chat'),
      audit: document.getElementById('panel-audit'),
      history: document.getElementById('panel-history')
    };

    // Sidebar Participant List
    this.participantListEl = document.getElementById('participant-list');
    this.participantSearchInput = document.getElementById('participant-search');
    this.filterButtons = document.querySelectorAll('.filter-pill');
    this.filterCountAll = document.getElementById('filter-count-all');
    this.filterCountAlive = document.getElementById('filter-count-alive');
    this.filterCountEliminated = document.getElementById('filter-count-eliminated');

    // Sidebar Chat Feed
    this.chatFeedEl = document.getElementById('chat-feed-list');
    this.chatInputSim = document.getElementById('chat-sim-input');
    this.btnSendSimChat = document.getElementById('btn-send-sim-chat');

    // Sidebar Audit Log
    this.auditLogListEl = document.getElementById('audit-log-list');

    // Sidebar History
    this.historyListEl = document.getElementById('history-list');

    // Modals
    this.modalChatConfig = document.getElementById('modal-chat-config');
    this.modalDebug = document.getElementById('modal-debug');
    this.toastContainer = document.getElementById('toast-container');

    // Winner Screen Elements
    this.winnerUsernameEl = document.getElementById('winner-username');
    this.winnerAvatarEl = document.getElementById('winner-avatar');
    this.winnerStatsEl = document.getElementById('winner-stats');
    this.podiumFirstEl = document.getElementById('podium-first');
    this.podiumSecondEl = document.getElementById('podium-second');
    this.podiumThirdEl = document.getElementById('podium-third');
    this.btnWinnerPlayAgain = document.getElementById('btn-winner-play-again');
    this.btnWinnerNewRound = document.getElementById('btn-winner-new-round');
    this.btnWinnerViewAudit = document.getElementById('btn-winner-view-audit');
  }

  _bindEvents() {
    // ParticipantManager Events
    this.participantManager.on('add', (participant) => {
      this.audioManager.playJoin();
      this.showToast(`✨ ${participant.username} joined the arena!`, 'success');
      this._updateParticipantsView();
      this._updateHeaderBadges();
    });

    this.participantManager.on('remove', (participant) => {
      this.showToast(`🚪 ${participant.username} left the giveaway.`, 'info');
      this._updateParticipantsView();
      this._updateHeaderBadges();
    });

    this.participantManager.on('change', () => {
      this._updateParticipantsView();
      this._updateHeaderBadges();
    });

    // GameManager Events
    this.gameManager.on('GAME_CHANGED', (meta) => {
      if (this.lblGameName) {
        this.lblGameName.textContent = meta ? meta.name : 'SELECT A GAME';
      }
      this._renderLobbyGames();
      this._renderGameSelector();
      this._updateControlButtons();
    });

    this.gameManager.on('GAME_REGISTERED', () => {
      this._renderLobbyGames();
      this._renderGameSelector();
    });

    this.gameManager.on('CATEGORY_CHANGED', () => {
      this._renderLobbyGames();
      this._renderGameSelector();
    });

    this.gameManager.on('GAME_STARTED', (data) => {
      this._showGameView();
      this.showToast(`🎮 ${data.game.name} started with ${data.participantsCount} players!`, 'success');
      this._updateControlButtons();
    });

    this.gameManager.on('TIMER_TICK', (data) => {
      if (this.lblDuration) {
        this.lblDuration.textContent = data.formatted;
      }
    });

    this.gameManager.on('SAFE_ZONE_SELECTED', (data) => {
      this._updateAuditLogView();
    });

    this.gameManager.on('PLAYER_ELIMINATED', (data) => {
      this._updateParticipantsView();
      this._updateHeaderBadges();
    });

    this.gameManager.on('WINNER_DECLARED', (data) => {
      this._showWinnerView(data);
      this._updateParticipantsView();
      this._updateHistoryView();
    });

    this.gameManager.on('GAME_STOPPED', () => {
      this._showLobbyView();
      this._updateControlButtons();
      this.showToast('Game stopped.', 'info');
    });

    this.gameManager.on('GAME_RESET', (data) => {
      this._showLobbyView();
      this._updateControlButtons();
      this._updateParticipantsView();
      this._updateAuditLogView();
      this._updateHeaderBadges();
      if (data.retainPlayers) {
        this.showToast(`Reset arena with ${data.count} existing players!`, 'success');
      } else {
        this.showToast('Lobby cleared. Ready for new entrants.', 'info');
      }
    });

    this.gameManager.on('ERROR', (err) => {
      this.showToast(`⚠️ ${err.message}`, 'error');
    });

    // KickChatManager Events
    this.kickChatManager.setCallbacks({
      onJoin: (sender) => {
        const res = this.participantManager.add(sender);
        if (!res.success && res.reason !== 'Already joined') {
          console.log(`Join rejected for ${sender}:`, res.reason);
        }
      },
      onLeave: (sender) => {
        this.participantManager.remove(sender);
      },
      onStart: (sender) => {
        if (this.gameManager.state === 'LOBBY') {
          this.gameManager.startGame();
        }
      },
      onReset: (sender) => {
        this.gameManager.resetGame(false);
      },
      onTurbo: (sender) => {
        if (this.gameManager.activeGameInstance && typeof this.gameManager.activeGameInstance.handleTurboCommand === 'function') {
          const res = this.gameManager.activeGameInstance.handleTurboCommand(sender);
          if (res.success) {
            this.showToast(`🚀 ${sender} activated MA TURBO!!`, 'success');
          } else {
            this.showToast(`⚠️ ${sender}: ${res.reason}`, 'info');
          }
        }
      },
      onMessage: (chatItem) => {
        this._appendChatMessage(chatItem);
      },
      onStatusChange: (statusData) => {
        this._updateChatStatusBadge(statusData);
      }
    });

    // Control Bar Buttons
    const btnQuickAdd10 = document.getElementById('btn-quick-add-10');
    if (btnQuickAdd10) {
      btnQuickAdd10.addEventListener('click', () => {
        this.audioManager.playClick();
        this.participantManager.addTestPlayers(10);
        this.showToast('Added 10 test players!', 'success');
      });
    }

    // Category Tabs Buttons
    document.querySelectorAll('.category-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const cat = btn.getAttribute('data-category');
        if (cat) {
          this.audioManager.playClick();
          this.gameManager.setCategory(cat);
          this._renderLobbyGames();
          this._renderGameSelector();
        }
      });
    });

    const btnLobbyAdd10 = document.getElementById('btn-lobby-add-10');
    if (btnLobbyAdd10) {
      btnLobbyAdd10.addEventListener('click', () => {
        this.audioManager.playClick();
        this.participantManager.addTestPlayers(10);
        this.showToast('Added 10 test players!', 'success');
      });
    }

    if (this.btnStartGame) {
      this.btnStartGame.addEventListener('click', () => {
        this.audioManager.playClick();
        this.gameManager.startGame();
      });
    }

    if (this.btnStopGame) {
      this.btnStopGame.addEventListener('click', () => {
        this.audioManager.playClick();
        this.gameManager.stopGame();
      });
    }

    if (this.btnSkipRound) {
      this.btnSkipRound.addEventListener('click', () => {
        this.audioManager.playClick();
        this.gameManager.skipRound();
      });
    }

    if (this.btnResetGame) {
      this.btnResetGame.addEventListener('click', () => {
        this.audioManager.playClick();
        this._promptResetDialog();
      });
    }

    // Tabs
    this.tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.audioManager.playClick();
        const tab = btn.getAttribute('data-tab');
        this._switchTab(tab);
      });
    });

    // Participant Filters
    this.filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.audioManager.playClick();
        this.filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.participantFilter = btn.getAttribute('data-filter') || 'ALL';
        this._renderParticipantList();
      });
    });

    // Participant Search
    if (this.participantSearchInput) {
      this.participantSearchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this._renderParticipantList();
      });
    }

    // Audio Mute Toggle
    if (this.btnMuteToggle) {
      this.btnMuteToggle.addEventListener('click', () => {
        const isMuted = this.audioManager.toggleMute();
        this.btnMuteToggle.textContent = isMuted ? '🔇 UNMUTE' : '🔊 AUDIO';
        this.btnMuteToggle.classList.toggle('muted', isMuted);
      });
    }

    // Chat Config Modal
    if (this.btnConfigChat) {
      this.btnConfigChat.addEventListener('click', () => {
        this.audioManager.playClick();
        if (this.modalChatConfig) this.modalChatConfig.classList.add('active');
      });
    }

    const btnCloseConfig = document.getElementById('btn-close-config-modal');
    if (btnCloseConfig) {
      btnCloseConfig.addEventListener('click', () => {
        if (this.modalChatConfig) this.modalChatConfig.classList.remove('active');
      });
    }

    const btnSaveChatroom = document.getElementById('btn-save-chatroom');
    const inputChatroomId = document.getElementById('input-chatroom-id');
    if (btnSaveChatroom && inputChatroomId) {
      btnSaveChatroom.addEventListener('click', () => {
        const id = inputChatroomId.value.trim();
        if (id) {
          this.kickChatManager.connect(id);
          if (this.modalChatConfig) this.modalChatConfig.classList.remove('active');
          this.showToast(`Connecting to Kick chatroom: ${id}`, 'info');
        }
      });
    }

    // Debug Modal
    if (this.btnDebugModal) {
      this.btnDebugModal.addEventListener('click', () => {
        this.audioManager.playClick();
        if (this.modalDebug) this.modalDebug.classList.add('active');
      });
    }

    const btnCloseDebug = document.getElementById('btn-close-debug-modal');
    if (btnCloseDebug) {
      btnCloseDebug.addEventListener('click', () => {
        if (this.modalDebug) this.modalDebug.classList.remove('active');
      });
    }

    // Quick Command Chips
    document.querySelectorAll('.cmd-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const cmd = btn.getAttribute('data-cmd');
        if (cmd) {
          if (this.chatInputSim) {
            this.chatInputSim.value = cmd;
            if (this.btnSendSimChat) this.btnSendSimChat.click();
          }
        }
      });
    });

    // Chat Sim Send
    if (this.btnSendSimChat && this.chatInputSim) {
      const sendSim = () => {
        const text = this.chatInputSim.value.trim();
        if (text) {
          let sender = '';
          let commandText = text;

          const colonMatch = text.match(/^([a-zA-Z0-9_]+)[:\s]+(!?\w+.*)$/);
          if (colonMatch && (colonMatch[2].startsWith('!') || colonMatch[2].toLowerCase().includes('turbo'))) {
            sender = colonMatch[1];
            commandText = colonMatch[2];
          } else if (text.toLowerCase().includes('turbo')) {
            const parts = text.split(/\s+/);
            if (parts.length > 1 && parts[0].toLowerCase().includes('turbo')) {
              sender = parts[1];
              commandText = '!masturbo';
            } else {
              const alive = this.participantManager.getAlive();
              if (alive.length > 0) {
                if (this.gameManager.activeGameInstance && this.gameManager.activeGameInstance.racers) {
                  const availableCar = this.gameManager.activeGameInstance.racers.find(r => !r.masturboUsed && !r.finished);
                  sender = availableCar ? availableCar.name : alive[0].username;
                } else {
                  sender = alive[Math.floor(Math.random() * alive.length)].username;
                }
              } else {
                sender = 'Viewer_' + Math.floor(Math.random() * 899 + 100);
              }
            }
          } else {
            sender = 'Viewer_' + Math.floor(Math.random() * 899 + 100);
          }

          this.kickChatManager.simulateMessage(sender, commandText);
          this.chatInputSim.value = '';
        }
      };
      this.btnSendSimChat.addEventListener('click', sendSim);
      this.chatInputSim.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendSim();
      });
    }

    // Winner Screen Buttons
    if (this.btnCloseWinnerModal) {
      this.btnCloseWinnerModal.addEventListener('click', () => {
        this.winnerModal.classList.remove('active');
        this.winnerModal.style.display = 'none';
      });
    }

    if (this.btnWinnerPlayAgain) {
      this.btnWinnerPlayAgain.addEventListener('click', () => {
        this.audioManager.playClick();
        this.winnerModal.classList.remove('active');
        this.winnerModal.style.display = 'none';
        this.gameManager.resetGame(true); // Retain existing entrants
        setTimeout(() => {
          this.gameManager.startGame();
        }, 150);
      });
    }

    if (this.btnWinnerNewRound) {
      this.btnWinnerNewRound.addEventListener('click', () => {
        this.audioManager.playClick();
        this.winnerModal.classList.remove('active');
        this.winnerModal.style.display = 'none';
        this.gameManager.resetGame(false); // Clear participants
      });
    }

    if (this.btnWinnerViewAudit) {
      this.btnWinnerViewAudit.addEventListener('click', () => {
        this.audioManager.playClick();
        this.winnerModal.classList.remove('active');
        this.winnerModal.style.display = 'none';
        this._switchTab('audit');
      });
    }
  }

  _renderLobbyGames() {
    if (!this.lobbyGamesGrid) return;

    const currentCategory = this.gameManager.activeCategory || 'spectator';
    const games = this.gameManager.getAvailableGames(currentCategory);
    const selectedId = this.gameManager.selectedGameId;

    if (this.categoryTabs) {
      this.categoryTabs.forEach(tab => {
        const cat = tab.getAttribute('data-category');
        tab.classList.toggle('active', cat === currentCategory);
      });
    }

    if (this.categorySubtitle) {
      this.categorySubtitle.textContent = currentCategory === 'duel'
        ? 'Cinematic 1v1 Gladiator showdowns • 50-60s full-length battles'
        : 'Select an interactive game mode for your Kick stream giveaway';
    }

    if (games.length === 0) {
      this.lobbyGamesGrid.innerHTML = `
        <div class="empty-list-placeholder">
          No games found in this category.
        </div>
      `;
      return;
    }

    this.lobbyGamesGrid.innerHTML = games.map(g => {
      const isSelected = g.id === selectedId;
      return `
        <div class="lobby-game-card ${isSelected ? 'selected' : ''}" data-game-id="${g.id}">
          <div class="game-card-icon">${g.icon}</div>
          <div class="game-card-info">
            <div class="game-card-top">
              <div class="game-card-title">${g.name}</div>
              <span class="game-card-badge ${isSelected ? 'badge-selected' : ''}">
                ${isSelected ? '✓ READY TO PLAY' : 'CLICK TO SELECT'}
              </span>
            </div>
            <div class="game-card-desc">${g.description}</div>
          </div>
        </div>
      `;
    }).join('');

    this.lobbyGamesGrid.querySelectorAll('.lobby-game-card').forEach(card => {
      card.addEventListener('click', () => {
        const gameId = card.getAttribute('data-game-id');
        this.audioManager.playClick();
        this.gameManager.selectGame(gameId);
      });
    });
  }

  _renderGameSelector() {
    if (!this.gameSelectorBar) return;

    const currentCategory = this.gameManager.activeCategory || 'spectator';
    const games = this.gameManager.getAvailableGames(currentCategory);
    const selectedId = this.gameManager.selectedGameId;

    if (games.length === 0) {
      this.gameSelectorBar.innerHTML = `<span style="font-size: 11px; color: var(--text-muted);">No games loaded</span>`;
      return;
    }

    this.gameSelectorBar.innerHTML = games.map(g => {
      const isSelected = g.id === selectedId;
      return `
        <button class="game-select-card ${isSelected ? 'selected' : ''}" data-game-id="${g.id}">
          <span>${g.icon}</span>
          <span>${g.name}</span>
        </button>
      `;
    }).join('');

    this.gameSelectorBar.querySelectorAll('.game-select-card').forEach(btn => {
      btn.addEventListener('click', () => {
        const gameId = btn.getAttribute('data-game-id');
        this.audioManager.playClick();
        this.gameManager.selectGame(gameId);
      });
    });
  }

  _updateHeaderBadges() {
    const total = this.participantManager.getCount();
    const alive = this.participantManager.getAliveCount();
    const isPlaying = this.gameManager.state === 'PLAYING';

    if (this.participantCountBadge) {
      this.participantCountBadge.textContent = isPlaying
        ? `👥 ${alive}/${total} ALIVE`
        : `👥 ${total} PARTICIPANTS`;
    }

    if (this.lblPlayersCount) {
      this.lblPlayersCount.textContent = total.toString();
    }

    if (this.filterCountAll) this.filterCountAll.textContent = total.toString();
    if (this.filterCountAlive) this.filterCountAlive.textContent = alive.toString();
    if (this.filterCountEliminated) this.filterCountEliminated.textContent = (total - alive).toString();
  }

  _updateControlButtons() {
    const isPlaying = this.gameManager.state === 'PLAYING';
    const hasEnoughPlayers = this.participantManager.getCount() >= 2;

    const btnQuickAdd10 = document.getElementById('btn-quick-add-10');
    if (btnQuickAdd10) {
      btnQuickAdd10.style.display = isPlaying ? 'none' : 'inline-flex';
    }

    if (this.btnStartGame) {
      this.btnStartGame.style.display = isPlaying ? 'none' : 'inline-flex';
      this.btnStartGame.disabled = !hasEnoughPlayers;
    }

    if (this.btnStopGame) {
      this.btnStopGame.style.display = isPlaying ? 'inline-flex' : 'none';
    }

    if (this.btnSkipRound) {
      this.btnSkipRound.style.display = isPlaying ? 'inline-flex' : 'none';
    }
  }

  _switchTab(tabKey) {
    this.activeTab = tabKey;

    this.tabButtons.forEach(btn => {
      const t = btn.getAttribute('data-tab');
      btn.classList.toggle('active', t === tabKey);
    });

    Object.entries(this.tabPanels).forEach(([key, panel]) => {
      if (panel) {
        panel.classList.toggle('active', key === tabKey);
      }
    });

    if (tabKey === 'participants') this._updateParticipantsView();
    if (tabKey === 'audit') this._updateAuditLogView();
    if (tabKey === 'history') this._updateHistoryView();
  }

  _showGameView() {
    if (this.lobbyView) this.lobbyView.style.display = 'none';
    if (this.gameCanvasContainer) this.gameCanvasContainer.style.display = 'flex';
    if (this.winnerModal) {
      this.winnerModal.classList.remove('active');
      this.winnerModal.style.display = 'none';
    }
  }

  _showLobbyView() {
    if (this.lobbyView) this.lobbyView.style.display = 'flex';
    if (this.gameCanvasContainer) {
      this.gameCanvasContainer.style.display = 'none';
      this.gameCanvasContainer.innerHTML = '';
    }
    if (this.winnerModal) {
      this.winnerModal.classList.remove('active');
      this.winnerModal.style.display = 'none';
    }
    this._renderLobbyGames();
    this._renderGameSelector();
  }

  _showWinnerView(data) {
    if (!this.winnerModal) return;

    const winner = data.winner;
    const winnerName = data.winnerName || (typeof winner === 'string' ? winner : (winner?.username || winner?.name || winner?.entrant || 'Champion'));
    const matchRecord = data.matchRecord;
    const meta = this.gameManager.getSelectedGameMeta();

    // Update Winner Title & Game Badge
    if (this.winnerTitleEl) {
      this.winnerTitleEl.textContent = 'GIVEAWAY CHAMPION';
    }
    if (this.winnerGameBadgeEl) {
      this.winnerGameBadgeEl.textContent = `${meta?.icon || '🎮'} ${meta?.name || 'GAME ARENA'}`;
    }

    // Update Winner Username
    if (this.winnerUsernameEl) {
      this.winnerUsernameEl.textContent = winnerName;
    }

    // Update Winner Avatar
    if (this.winnerAvatarEl) {
      const charInitial = winner?.initial || winnerName.charAt(0).toUpperCase();
      this.winnerAvatarEl.textContent = charInitial;
      this.winnerAvatarEl.style.backgroundColor = winner?.palette?.bg || '#53FC18';
      this.winnerAvatarEl.style.color = winner?.palette?.text || '#000000';
    }

    // Update Winner Stats
    if (this.winnerStatsEl) {
      const totalEntrants = matchRecord?.totalParticipants || this.participantManager.getCount() || 2;
      const duration = data.durationFormatted || this.gameManager.getFormattedDuration() || '00:45';
      let statsHtml = `
        <div class="stat-pill">👥 ${totalEntrants} Entrants</div>
        <div class="stat-pill">⏱ ${duration} Match Time</div>
      `;
      if (data.score) {
        statsHtml += `<div class="stat-pill">⚡ ${data.score}</div>`;
      }
      if (data.streak) {
        statsHtml += `<div class="stat-pill">🔥 ${data.streak}</div>`;
      }
      if (data.deflections) {
        statsHtml += `<div class="stat-pill">🛡 ${data.deflections}</div>`;
      }
      if (data.character) {
        statsHtml += `<div class="stat-pill">🥋 ${data.character}</div>`;
      }
      this.winnerStatsEl.innerHTML = statsHtml;
    }

    // Update Podium
    const runnerUpName = data.runnerUp || matchRecord?.podium?.second || (meta?.category === 'duel' ? 'Runner Up' : 'Runner Up');
    const thirdName = matchRecord?.podium?.third || (meta?.category === 'duel' ? 'Duelist' : '3rd Place');

    if (this.podiumFirstEl) this.podiumFirstEl.textContent = winnerName;
    if (this.podiumSecondEl) this.podiumSecondEl.textContent = runnerUpName;
    if (this.podiumThirdEl) this.podiumThirdEl.textContent = thirdName;

    // Trigger celebration fanfare
    if (this.audioManager) {
      this.audioManager.playRoundTransition();
    }

    // Display winner toast
    this.showToast(`🏆 ${winnerName} WON ${meta?.name || 'THE SHOWDOWN'}!`, 'success');

    // Display modal clearly immediately
    this.winnerModal.classList.add('active');
    this.winnerModal.style.display = 'flex';
    this.winnerModal.style.zIndex = '999999';
    this.winnerModal.style.opacity = '1';
    this.winnerModal.style.visibility = 'visible';
  }

  _promptResetDialog() {
    if (this.participantManager.getCount() > 0) {
      const shouldRetain = confirm('Reset Arena:\n\nClick OK to KEEP current players for a new round.\nClick Cancel to CLEAR all players for new entrants.');
      this.gameManager.resetGame(shouldRetain);
    } else {
      this.gameManager.resetGame(false);
    }
  }

  _updateChatStatusBadge(statusData) {
    if (!this.chatStatusBadge) return;

    if (statusData.status === 'CONNECTED') {
      this.chatStatusBadge.className = 'status-badge connected';
      this.chatStatusBadge.innerHTML = `<span class="dot"></span> KICK CHAT: CONNECTED (${statusData.chatroomId})`;
    } else if (statusData.status === 'CONNECTING') {
      this.chatStatusBadge.className = 'status-badge connecting';
      this.chatStatusBadge.innerHTML = `<span class="dot pulse"></span> CONNECTING TO KICK...`;
    } else {
      this.chatStatusBadge.className = 'status-badge disconnected';
      this.chatStatusBadge.innerHTML = `<span class="dot"></span> KICK CHAT DISCONNECTED`;
    }
  }

  _updateParticipantsView() {
    this._renderParticipantList();
    this._updateControlButtons();
  }

  _renderParticipantList() {
    if (!this.participantListEl) return;

    let list = this.participantManager.getAll();

    // Filter
    if (this.participantFilter === 'ALIVE') {
      list = list.filter(p => p.alive && p.status !== 'ELIMINATED');
    } else if (this.participantFilter === 'ELIMINATED') {
      list = list.filter(p => !p.alive || p.status === 'ELIMINATED');
    }

    // Search query
    if (this.searchQuery) {
      list = list.filter(p => p.username.toLowerCase().includes(this.searchQuery));
    }

    if (list.length === 0) {
      this.participantListEl.innerHTML = `
        <div class="empty-list-placeholder">
          No participants found.
        </div>
      `;
      return;
    }

    this.participantListEl.innerHTML = list.map(p => {
      let statusClass = 'status-joined';
      let statusText = 'JOINED';

      if (p.status === 'WINNER') {
        statusClass = 'status-winner';
        statusText = '👑 WINNER';
      } else if (p.status === 'PLAYING') {
        statusClass = 'status-playing';
        statusText = 'PLAYING';
      } else if (p.status === 'ELIMINATED') {
        statusClass = 'status-eliminated';
        statusText = p.finalRank ? `#${p.finalRank} ELIMINATED` : 'ELIMINATED';
      }

      return `
        <div class="participant-row ${p.alive ? '' : 'eliminated-row'}">
          <div class="user-avatar" style="background: ${p.palette.bg}; color: ${p.palette.text}">
            ${p.initial}
          </div>
          <div class="user-info">
            <div class="user-name">${p.username}</div>
            <div class="user-meta">${new Date(p.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
          </div>
          <div class="user-status-pill ${statusClass}">
            ${statusText}
          </div>
        </div>
      `;
    }).join('');
  }

  _appendChatMessage(chatItem) {
    if (!this.chatFeedEl) return;

    const row = document.createElement('div');
    row.className = `chat-row ${chatItem.isCommand ? 'command-row' : ''}`;
    row.innerHTML = `
      <span class="chat-time">${chatItem.timeFormatted}</span>
      <span class="chat-sender">${chatItem.sender}:</span>
      <span class="chat-text">${chatItem.content}</span>
    `;

    this.chatFeedEl.prepend(row);

    // Prune excessive rows
    while (this.chatFeedEl.children.length > 60) {
      this.chatFeedEl.removeChild(this.chatFeedEl.lastChild);
    }
  }

  _updateAuditLogView() {
    if (!this.auditLogListEl) return;

    const logs = this.randomManager.getAuditLog();

    if (logs.length === 0) {
      this.auditLogListEl.innerHTML = `
        <div class="empty-list-placeholder">
          No rolls recorded yet. Starts when 50/50 Survival runs!
        </div>
      `;
      return;
    }

    this.auditLogListEl.innerHTML = logs.map(entry => `
      <div class="audit-card">
        <div class="audit-header">
          <span class="audit-round">ROUND ${entry.round}</span>
          <span class="audit-time">${entry.timeFormatted}</span>
        </div>
        <div class="audit-body">
          <div class="audit-result">
            SAFE ZONE: <strong class="zone-${entry.safeZone.toLowerCase()}">${entry.safeZone}</strong>
          </div>
          <div class="audit-details">
            <div>Roll: <code>${entry.rollValue}</code> (Float [0, 1))</div>
            <div>Crypto Seed: <code>${entry.seedHex}</code></div>
            <div class="audit-method">✓ Verifiable: ${entry.method}</div>
          </div>
        </div>
      </div>
    `).join('');
  }

  _updateHistoryView() {
    if (!this.historyListEl) return;

    const history = this.leaderboardManager.getHistory();
    const stats = this.leaderboardManager.getStats();

    if (history.length === 0) {
      this.historyListEl.innerHTML = `
        <div class="empty-list-placeholder">
          No past giveaways recorded yet.
        </div>
      `;
      return;
    }

    const statsHeader = `
      <div class="history-stats-bar">
        <div class="stat-box">
          <div class="num">${stats.totalMatches}</div>
          <div class="lbl">Giveaways</div>
        </div>
        <div class="stat-box">
          <div class="num">${stats.totalPlayersSum}</div>
          <div class="lbl">Entrants</div>
        </div>
        <div class="stat-box">
          <div class="num">${stats.avgDuration}s</div>
          <div class="lbl">Avg Time</div>
        </div>
      </div>
    `;

    const matchesList = history.map(m => `
      <div class="history-card">
        <div class="history-top">
          <span class="history-game">${m.gameName}</span>
          <span class="history-time">${m.dateFormatted} ${m.timeFormatted}</span>
        </div>
        <div class="history-winner">
          🏆 Winner: <strong>${m.winner}</strong>
        </div>
        <div class="history-meta">
          <span>👥 ${m.totalParticipants} players</span>
          <span>⏱ ${m.durationSec}s</span>
          <span>🎲 ${m.roundsCount} rounds</span>
        </div>
      </div>
    `).join('');

    this.historyListEl.innerHTML = statsHeader + matchesList;
  }

  showToast(message, type = 'info') {
    if (!this.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    this.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }
}
