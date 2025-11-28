// PokéAPI base URL
const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2/';

// Store loaded Pokemon data
let pokemonList = [];
let selectedPokemon = null;
let opponentPokemon = null;

// Battle state
let battleState = {
    playerHP: 100,
    opponentHP: 100,
    currentRound: 0,
    maxRounds: 3,
    battleStarted: false,
    battleFinished: false
};

// Map Pokemon types from API to attack types
const TYPE_MAPPING = {
    'fire': 'fuego',
    'water': 'agua',
    'grass': 'planta',
    'flying': 'volador',
    'normal': 'aire',
    'psychic': 'aire',
    'electric': 'aire',
    'ice': 'aire',
    'dragon': 'aire',
    'dark': 'aire',
    'fairy': 'aire',
    'fighting': 'aire',
    'ghost': 'aire',
    'ground': 'aire',
    'rock': 'aire',
    'bug': 'aire',
    'poison': 'aire',
    'steel': 'aire'
};

// Type effectiveness chart (attacker type -> defender type -> multiplier)
// 2.0 = super effective, 0.5 = not very effective, 1.0 = normal
const TYPE_EFFECTIVENESS = {
    'fuego': {
        'planta': 2.0,
        'agua': 0.5,
        'aire': 1.0,
        'volador': 1.0,
        'fuego': 0.5
    },
    'agua': {
        'fuego': 2.0,
        'planta': 0.5,
        'aire': 1.0,
        'volador': 1.0,
        'agua': 0.5
    },
    'planta': {
        'agua': 2.0,
        'fuego': 0.5,
        'aire': 1.0,
        'volador': 1.0,
        'planta': 0.5
    },
    'aire': {
        'volador': 2.0,
        'fuego': 1.0,
        'agua': 1.0,
        'planta': 1.0,
        'aire': 1.0
    },
    'volador': {
        'planta': 2.0,
        'aire': 2.0,
        'fuego': 1.0,
        'agua': 1.0,
        'volador': 1.0
    }
};

// Initialize game and load Pokemon from API
function IniciarJuego(){
    // Load Pokemon from PokéAPI
    loadPokemonFromAPI();
    
    // Setup button event listeners
    let botonLoomianJugador = document.getElementById('boton-loomian');
    botonLoomianJugador.addEventListener('click', seleccionarLommianJugador);
    
    // Setup attack button listeners
    document.getElementById('boton-fuego').addEventListener('click', () => processPlayerAttack('fuego'));
    document.getElementById('boton-agua').addEventListener('click', () => processPlayerAttack('agua'));
    document.getElementById('boton-planta').addEventListener('click', () => processPlayerAttack('planta'));
    document.getElementById('boton-aire').addEventListener('click', () => processPlayerAttack('aire'));
    document.getElementById('boton-volador').addEventListener('click', () => processPlayerAttack('volador'));
    
    // Setup restart button
    document.getElementById('reiniciar').addEventListener('click', resetGame);
}

// Reset game to initial state
function resetGame() {
    battleState = {
        playerHP: 100,
        opponentHP: 100,
        currentRound: 0,
        maxRounds: 3,
        battleStarted: false,
        battleFinished: false
    };
    
    selectedPokemon = null;
    opponentPokemon = null;
    
    // Reset UI
    document.getElementById('Mensajes').innerHTML = '<p>Select your Pokemon and start a new battle!</p>';
    updateBattleUI();
    
    // Uncheck all radio buttons
    const radioButtons = document.querySelectorAll('input[name="loomian"]');
    radioButtons.forEach(radio => radio.checked = false);
    
    // Disable attack buttons until battle starts
    enableAttackButtons();
}

// Fetch Pokemon list from PokéAPI
async function loadPokemonFromAPI() {
    try {
        const optionsContainer = document.getElementById('pokemon-options');
        optionsContainer.innerHTML = '<p>Loading Pokemon from PokéAPI...</p>';
        
        // Fetch first 20 Pokemon (you can adjust the limit)
        const response = await fetch(`${POKEAPI_BASE_URL}pokemon?limit=20&offset=0`);
        const data = await response.json();
        
        // Fetch detailed data for each Pokemon
        const pokemonPromises = data.results.map(async (pokemon) => {
            const pokemonResponse = await fetch(pokemon.url);
            return await pokemonResponse.json();
        });
        
        pokemonList = await Promise.all(pokemonPromises);
        
        // Render Pokemon options as radio buttons
        renderPokemonOptions();
        
    } catch (error) {
        console.error('Error loading Pokemon from API:', error);
        document.getElementById('pokemon-options').innerHTML = 
            '<p>Error loading Pokemon. Please try again later.</p>';
    }
}

// Render Pokemon as radio button options
function renderPokemonOptions() {
    const optionsContainer = document.getElementById('pokemon-options');
    optionsContainer.innerHTML = '';
    
    pokemonList.forEach((pokemon, index) => {
        // Create radio input
        const radioInput = document.createElement('input');
        radioInput.type = 'radio';
        radioInput.id = `pokemon-${pokemon.id}`;
        radioInput.name = 'loomian';
        radioInput.value = pokemon.id;
        radioInput.dataset.pokemonId = pokemon.id;
        
        // Create label with Pokemon name and sprite
        const label = document.createElement('label');
        label.htmlFor = `pokemon-${pokemon.id}`;
        
        // Add Pokemon sprite image
        if (pokemon.sprites && pokemon.sprites.front_default) {
            const img = document.createElement('img');
            img.src = pokemon.sprites.front_default;
            img.alt = pokemon.name;
            img.style.width = '50px';
            img.style.height = '50px';
            img.style.verticalAlign = 'middle';
            img.style.marginRight = '10px';
            label.appendChild(img);
        }
        
        // Add Pokemon name (capitalized)
        const nameText = document.createTextNode(` ${pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}`);
        label.appendChild(nameText);
        
        // Add types information
        if (pokemon.types && pokemon.types.length > 0) {
            const typesText = pokemon.types.map(t => t.type.name).join(', ');
            const typesSpan = document.createElement('span');
            typesSpan.textContent = ` (${typesText})`;
            typesSpan.style.fontSize = '0.9em';
            typesSpan.style.color = '#666';
            label.appendChild(typesSpan);
        }
        
        // Create container div for each option
        const optionDiv = document.createElement('div');
        optionDiv.style.marginBottom = '10px';
        optionDiv.appendChild(radioInput);
        optionDiv.appendChild(label);
        
        optionsContainer.appendChild(optionDiv);
    });
}

// Get attack type from Pokemon types (uses first type, or second if first doesn't map)
function getAttackType(pokemon) {
    if (!pokemon.types || pokemon.types.length === 0) {
        return 'aire'; // Default type
    }
    
    // Try to map the first type
    const firstType = pokemon.types[0].type.name;
    if (TYPE_MAPPING[firstType]) {
        return TYPE_MAPPING[firstType];
    }
    
    // Try second type if available
    if (pokemon.types.length > 1) {
        const secondType = pokemon.types[1].type.name;
        if (TYPE_MAPPING[secondType]) {
            return TYPE_MAPPING[secondType];
        }
    }
    
    // Default to 'aire'
    return 'aire';
}

// Calculate damage based on attack type and defender type
function calculateDamage(attackType, defenderType) {
    const baseDamage = 20;
    const effectiveness = TYPE_EFFECTIVENESS[attackType]?.[defenderType] || 1.0;
    const damage = Math.floor(baseDamage * effectiveness);
    
    return {
        damage: damage,
        effectiveness: effectiveness,
        message: effectiveness === 2.0 ? 'Super effective!' : 
                 effectiveness === 0.5 ? 'Not very effective...' : 
                 'Normal effectiveness'
    };
}

// Select random opponent Pokemon
function selectOpponentPokemon() {
    if (pokemonList.length === 0) return null;
    
    // Select a random Pokemon that's not the player's choice
    let opponent;
    do {
        const randomIndex = Math.floor(Math.random() * pokemonList.length);
        opponent = pokemonList[randomIndex];
    } while (opponent.id === selectedPokemon.id && pokemonList.length > 1);
    
    return opponent;
}

// Start battle
function startBattle() {
    if (!selectedPokemon) {
        alert('Please select your Pokemon first!');
        return;
    }
    
    // Select opponent
    opponentPokemon = selectOpponentPokemon();
    if (!opponentPokemon) {
        alert('Error: Could not select opponent Pokemon');
        return;
    }
    
    // Reset battle state
    battleState = {
        playerHP: 100,
        opponentHP: 100,
        currentRound: 0,
        maxRounds: 3,
        battleStarted: true,
        battleFinished: false
    };
    
    // Update UI
    updateBattleUI();
    displayBattleStart();
    
    // Enable attack buttons
    enableAttackButtons();
}

// Display battle start message
function displayBattleStart() {
    const messagesSection = document.getElementById('Mensajes');
    const playerName = selectedPokemon.name.charAt(0).toUpperCase() + selectedPokemon.name.slice(1);
    const opponentName = opponentPokemon.name.charAt(0).toUpperCase() + opponentPokemon.name.slice(1);
    
    messagesSection.innerHTML = `
        <h3>Battle Started!</h3>
        <p><strong>Your Pokemon:</strong> ${playerName} (${getAttackType(selectedPokemon)})</p>
        <p><strong>Opponent Pokemon:</strong> ${opponentName} (${getAttackType(opponentPokemon)})</p>
        <p>Select your attack type for Round ${battleState.currentRound + 1}!</p>
    `;
}

// Update battle UI with HP and round info
function updateBattleUI() {
    const playerHPSpan = document.getElementById('player-hp');
    const opponentHPSpan = document.getElementById('opponent-hp');
    
    if (playerHPSpan) {
        playerHPSpan.textContent = battleState.playerHP;
    }
    if (opponentHPSpan) {
        opponentHPSpan.textContent = battleState.opponentHP;
    }
    
    // Update round display
    const roundInfo = document.getElementById('round-info');
    if (roundInfo) {
        if (battleState.battleStarted) {
            roundInfo.textContent = `Round ${battleState.currentRound} of ${battleState.maxRounds}`;
        } else {
            roundInfo.textContent = `Round 0 of ${battleState.maxRounds}`;
        }
    }
}

// Enable/disable attack buttons
function enableAttackButtons() {
    const attackButtons = ['boton-fuego', 'boton-agua', 'boton-planta', 'boton-aire', 'boton-volador'];
    attackButtons.forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            // Enable buttons if battle started and not finished, disable otherwise
            btn.disabled = !battleState.battleStarted || battleState.battleFinished;
        }
    });
}

// Process player attack
function processPlayerAttack(attackType) {
    if (battleState.battleFinished) {
        return;
    }
    
    // Get attack types
    const playerAttackType = attackType;
    const opponentAttackType = getAttackType(opponentPokemon);
    
    // Calculate damage to opponent
    const playerDamageResult = calculateDamage(playerAttackType, opponentAttackType);
    battleState.opponentHP = Math.max(0, battleState.opponentHP - playerDamageResult.damage);
    
    // Opponent attacks with random type (using their Pokemon's type)
    const opponentAttackResult = calculateDamage(opponentAttackType, playerAttackType);
    battleState.playerHP = Math.max(0, battleState.playerHP - opponentAttackResult.damage);
    
    // Increment round
    battleState.currentRound++;
    
    // Update UI
    updateBattleUI();
    displayRoundResult(playerAttackType, opponentAttackType, playerDamageResult, opponentAttackResult);
    
    // Check if battle is finished
    if (battleState.currentRound >= battleState.maxRounds || battleState.playerHP <= 0 || battleState.opponentHP <= 0) {
        endBattle();
    }
}

// Display round result
function displayRoundResult(playerAttack, opponentAttack, playerDamage, opponentDamage) {
    const messagesSection = document.getElementById('Mensajes');
    const playerName = selectedPokemon.name.charAt(0).toUpperCase() + selectedPokemon.name.slice(1);
    const opponentName = opponentPokemon.name.charAt(0).toUpperCase() + opponentPokemon.name.slice(1);
    
    let resultHTML = `
        <h3>Round ${battleState.currentRound} Results</h3>
        <p><strong>${playerName}</strong> attacked with <strong>${playerAttack}</strong> - ${playerDamage.message} (${playerDamage.damage} damage)</p>
        <p><strong>${opponentName}</strong> attacked with <strong>${opponentAttack}</strong> - ${opponentDamage.message} (${opponentDamage.damage} damage)</p>
        <p><strong>Your HP:</strong> ${battleState.playerHP} | <strong>Opponent HP:</strong> ${battleState.opponentHP}</p>
    `;
    
    if (battleState.currentRound < battleState.maxRounds && battleState.playerHP > 0 && battleState.opponentHP > 0) {
        resultHTML += `<p>Select your attack for Round ${battleState.currentRound + 1}!</p>`;
    }
    
    messagesSection.innerHTML = resultHTML;
}

// End battle and show winner
function endBattle() {
    battleState.battleFinished = true;
    enableAttackButtons();
    
    const messagesSection = document.getElementById('Mensajes');
    const playerName = selectedPokemon.name.charAt(0).toUpperCase() + selectedPokemon.name.slice(1);
    const opponentName = opponentPokemon.name.charAt(0).toUpperCase() + opponentPokemon.name.slice(1);
    
    let winner;
    if (battleState.playerHP > battleState.opponentHP) {
        winner = 'You';
    } else if (battleState.opponentHP > battleState.playerHP) {
        winner = opponentName;
    } else {
        winner = 'Tie';
    }
    
    messagesSection.innerHTML = `
        <h2>Battle Finished!</h2>
        <p><strong>Final HP:</strong></p>
        <p>${playerName}: ${battleState.playerHP} HP</p>
        <p>${opponentName}: ${battleState.opponentHP} HP</p>
        <h3>Winner: ${winner}!</h3>
    `;
}

// Handle Pokemon selection
function seleccionarLommianJugador(){
    const selectedRadio = document.querySelector('input[name="loomian"]:checked');
    
    if (selectedRadio) {
        const pokemonId = parseInt(selectedRadio.value);
        selectedPokemon = pokemonList.find(p => p.id === pokemonId);
        
        if (selectedPokemon) {
            alert(`You selected ${selectedPokemon.name.charAt(0).toUpperCase() + selectedPokemon.name.slice(1)}!`);
            console.log('Selected Pokemon:', selectedPokemon);
            // Start battle automatically after selection
            startBattle();
        }
    } else {
        alert('Please select a Pokemon first!');
    }
}

// Initialize when page loads
window.addEventListener('load', IniciarJuego);
