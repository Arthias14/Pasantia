function IniciarJuego(){
        let botonLoomianJugador = document.getElementById('boton-loomian')
        botonLoomianJugador.addEventListener('click', seleccionarLommianJugador)

}

function seleccionarLommianJugador(){
    if (document.getElementById("watery").checked){
        alert("Seleccionaste a Watery")
    }
}

window.addEventListener('load', IniciarJuego)




