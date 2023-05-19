var boton = document.getElementById("button");
var logo = document.getElementById("logo");
var navItems = document.querySelectorAll("nav a");
var nav = document.getElementById("nav");
var body = document.body;
var temp = document.getElementById("temp");
var hum = document.getElementById("hum");
var form = document.getElementById("formulario");
var submit = document.getElementById("submit");
var errMsg = document.getElementById("error");
var nightButton = document.getElementById('day_night_button');
var isNightMode = localStorage.getItem('nightMode') == 'true';
var navUsername = document.getElementById('navUsername');

var data = document.getElementsByClassName("data");
var titulo = document.getElementById("titulo");
var temp = document.getElementById("temp");
var hum = document.getElementById("hum");

function night() {
    var menuItems = document.getElementsByClassName("menuItems");
    let logoutButton = document.getElementById("logout_button");
    let registerButton = document.getElementById("register_button");
    logo.src = "img/michilogo_noche.png";
    body.style.backgroundColor = "#131e26ff"; //azul oscuro
    boton.style.backgroundColor = "#131e26ff"; //azul oscuro
    nav.style.borderBottom = "3px solid #41647eff"; //azul claro
    nav.style.backgroundColor = "#131e26ff"; //azul oscuro
    nightButton.style.backgroundColor = "#41647eff"; //azul claro
    if (navUsername != null) {
       navUsername.style.color = "#41647eff"; //azul claro       
    }
    if (errMsg != null) {
        errMsg.style.color = "#41647eff"; //azul claro
    } 
    if(navItems[0].className == "navItem") {
        for (var i = 0; i < navItems.length; i++) {
            if(i != 2) {
                navItems[i].classList.remove("navItem");
                navItems[i].classList.add("navItem-night");
            }
        }
    }
    Array.from(menuItems).forEach(function(menuItem) {
        menuItem.classList.add("menuItems-night");
        menuItem.classList.remove("menuItems");
    });
    if(temp != null) {
        temp.style.border = "3px solid #41647eff"; //azul claro
        hum.style.border = "3px solid #41647eff"; //azul claro
    }
    if(document.querySelector("#formulario") != null) {
        form.style.border = "3px solid #41647eff"; //azul claro
        submit.style.backgroundColor = "#41647eff"; //azul claro
        submit.style.color = "white";
        submit.style.border = "2px solid #41647eff"; //azul claro

        submit.addEventListener("mouseover", function() {
            submit.style.backgroundColor = "white";
            submit.style.border = "3px solid #41647eff"; //azul claro
            submit.style.color = "#41647eff"; //azul claro
          });
          submit.addEventListener("mouseout", function() {
            submit.style.backgroundColor = "#41647eff"; //azul claro
            submit.style.color = "white";
          });
    };
    if (logoutButton != null) {
        logoutButton.id = "logout_button_night";
    };
    if (registerButton != null) {
        registerButton.id = "register_button_night";
    };
    document.querySelector("#day_night_button i.fa-moon").style.display = "none";
    document.querySelector("#day_night_button i.fa-certificate").style.display = "inline-block";
};

function day() {
    var menuItems = document.getElementsByClassName("menuItems-night");
    let logoutButton = document.getElementById("logout_button_night");
    let registerButton = document.getElementById("register_button_night");
    logo.src = "img/michilogo_dia.png";
    body.style.backgroundColor = "white"; //blanco
    boton.style.backgroundColor = "white"; //blanco
    nav.style.borderBottom = "3px solid #fc6704ff"; //naranja
    nav.style.backgroundColor = "white"; //blanco
    nightButton.style.backgroundColor = "#fc6704ff"; //naranja
    if (navUsername != null) {
        navUsername.style.color = "#fc6704ff"; //naranja
    }
    if (errMsg != null) {
        errMsg.style.color = "#fc6704ff"; //naranja
    } 
    if(navItems[0].className == "navItem-night") {
        for (var i = 0; i < navItems.length; i++) {
            if(i != 2) {
                navItems[i].classList.remove("navItem-night");
                navItems[i].classList.add("navItem");
            }
        }
    }
    Array.from(menuItems).forEach(function(menuItem) {
        menuItem.classList.add("menuItems");
        menuItem.classList.remove("menuItems-night");
    });
    if(temp != null) {
        temp.style.border = "3px solid #fc6704ff"; //naranja
        hum.style.border = "3px solid #fc6704ff"; //naranja
    }
    if(document.querySelector("#formulario") != null) {
    form.style.border = "3px solid #fc6704ff"; //naranja
    submit.style.backgroundColor = "#fc6704ff"; //naranja
    submit.style.color = "white";
    submit.style.border = "2px solid #fc6704ff"; //naranja
    
    submit.addEventListener("mouseover", function() {
        submit.style.backgroundColor = "white";
        submit.style.border = "3px solid #fc6704ff"; //naranja
        submit.style.color = "#fc6704ff"; //naranja
        });
    submit.addEventListener("mouseout", function() {
        submit.style.backgroundColor = "#fc6704ff"; //naranja
        submit.style.color = "white";
        });
    };
    if (logoutButton != null) {
        logoutButton.id = "logout_button";
    };
    if (registerButton != null) {
        registerButton.id = "register_button";
    };
    document.querySelector("#day_night_button i.fa-certificate").style.display = "none";
    document.querySelector("#day_night_button i.fa-moon").style.display = "inline-block";
};

// Leer el valor de modo día/noche desde localStorage
var isNightMode = localStorage.getItem('nightMode') == 'true';

// Aplicar los estilos correspondientes según el valor de isNightMode
if (isNightMode) {
    night();
} else {
    day();
}

function nightModeCheck() {
    if (window.getComputedStyle(body).getPropertyValue('background-color') == 'rgb(255, 255, 255)') {
        localStorage.setItem('nightMode', 'false');
    } else {
        localStorage.setItem('nightMode', 'true');
    }
}

function day_night(event) {
    event.preventDefault(); // Evita que el enlace recargue la página
    nightModeCheck();

    if (isNightMode) {
        day();
        isNightMode = false;
    }
    else {
        night();
        isNightMode = true;
    }

    localStorage.setItem('nightMode', isNightMode);
};






