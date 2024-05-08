import { dialogueData, scaleFactor } from './constants';
import { k } from './kaboomCtx';
import { displayDialogue, setCameraScale } from './utils';
import createPopupModal from './modal';


createPopupModal();


let player;

const modalContainer = document.querySelector(".modal-container");
const modalTracker = document.querySelector('.modal__image-container');
const indicatorContainer = document.querySelector('.modal__indicator-container');

// init gallery function variables
let transitionSpeed;
let galleries;

let modalImages;
let modalIndicators;
let currentIndex;
let lastIndex;
let isMoving = false;



k.loadSprite("spritesheet", "spritesheet.png", {
    sliceX: 39,
    sliceY: 31,
    anims: {
        "idle-down": 936,
        "walk-down": {from: 936, to: 939, loop: true, speed: 8},
        "idle-side": 975,
        "walk-side": {from: 975, to: 978, loop: true, speed: 8},
        "idle-up": 1014,
        "walk-up": {from: 1014, to: 1017, loop: true, speed: 8},
    }
});



k.loadSprite("map", "map.png");

k.setBackground(k.Color.fromHex("#311047"));



k.scene("main", async ()=>{
    const mapData = await (await fetch("map.json")).json()
    const layers = mapData.layers;

    const map = k.add([k.sprite("map"),k.pos(0), k.scale(scaleFactor)])

    player = k.make([
        k.sprite("spritesheet", {anim: "idle-down"}),
        k.area({
            shape: new k.Rect(k.vec2(0,3), 10, 10)
        }),
        k.body(),
        k.anchor("center"),
        k.pos(),
        k.scale(scaleFactor),
        {
            speed: 250,
            direction: "down",
            isInDialogue: false,
        },
        "player",
    ]);


    for (const layer of layers) {
        if (layer.name === "boundaries"){
            for (const boundary of layer.objects){
               map.add([
                k.area({
                    shape: new k.Rect(k.vec2(0), boundary.width, boundary.height), 
                }),
                k.body({isStatic: true}),
                k.pos(boundary.x, boundary.y),
                boundary.name,
               ]);
               
               
               if (boundary.name){
                player.onCollide(boundary.name, () => {
                    player.isInDialogue = true;
                    console.log('Boundary: ', boundary.name);
                    if (boundary.name === 'projects'){
                        // Show photos 

                        let currentGallery = galleries.find((g) => g.name === "Chicago").images;


                        // Load images into the modalTracker
                        [modalImages, modalIndicators] =  AddImgandIndtoGallery(currentGallery);
                        currentIndex = 1;
                        lastIndex = modalImages.length;
                        console.log(currentGallery);
  

                        // Correct gap for buttons when the number of images increase beyond a certain point
                        if (currentGallery.length > 7){
                            console.log("Here!!");
                            const btn_cntr = document.querySelector('.modal__btn-container');
                            btn_cntr.style.gap = '4rem';
                        }

                        moveGallery();

                        document.getElementById("close").style.display = "none";

                        displayDialogue(dialogueData[boundary.name], () => (console.log("display message")));


                        function waittoDisplayGallery() {
                            setTimeout(function () {
                                document.getElementById("close").style.display = "block";
                                document.getElementById("textbox-container").style.display = "none";
                                document.getElementById("dialogue").innerHTML = "";


                                modal.openModal();
                                
                            }, 3000);
                        }

                        waittoDisplayGallery();

                        
                        
                    }


                    else if (boundary.name === 'cs-degree') {
                        
                        let currentGallery = galleries.find((g) => g.name === "Degree").images;

                        [modalImages, modalIndicators] =  AddImgandIndtoGallery(currentGallery);
                        currentIndex = 1;
                        lastIndex = modalImages.length;
                        console.log(currentGallery);


                        moveGallery();

                        document.getElementById("close").style.display = "none";

                        displayDialogue(dialogueData[boundary.name], () => (console.log("display message")));


                        function waittoDisplayDegree() {
                            setTimeout(function () {
                                document.getElementById("close").style.display = "block";
                                document.getElementById("textbox-container").style.display = "none";
                                document.getElementById("dialogue").innerHTML = "";

                                document.querySelector('.modal__overlay').style.opacity = 0;

                                modal.openModal();
                                
                            }, 6000);
                        }

                        waittoDisplayDegree();



                    }


                    else {
                        displayDialogue(dialogueData[boundary.name], () => (player.isInDialogue = false));
                    }
                    
                });
               }

            }
            continue;
        }


        if(layer.name === "spawnpoints"){
            for (const entity of layer.objects){
                if (entity.name === "player"){
                    player.pos = k.vec2(
                        (map.pos.x + entity.x)*scaleFactor,
                        (map.pos.y + entity.y)*scaleFactor,
                        ); 
                        k.add(player);
                        continue;
                }
            }
        }
    }

    setCameraScale(k);

    k.onResize(() => {
        setCameraScale(k);
    })

    k.onUpdate(() => {
        k.camPos(player.pos.x, player.pos.y + 100)
    })


    k.onMouseDown((mouseBtn) => {
        if(mouseBtn !== "left" || player.isInDialogue) return;

        const worldMousePos = k.toWorld(k.mousePos());
        player.moveTo(worldMousePos, player.speed);


        const mouseAngle = player.pos.angle(worldMousePos);

        const lwBound = 50;
        const upBound = 125;

        if (mouseAngle > lwBound && mouseAngle < upBound && player.curAnim() !== "walk-up"){
            player.play("walk-up");
            player.direction = "up";
            return;
        }

        if (mouseAngle <  - lwBound && mouseAngle > - upBound && player.curAnim() !== "walk-down"){
            player.play("walk-down");
            player.direction = "down";
            return;
        }

        if (Math.abs(mouseAngle) > upBound){
            player.flipX = false;
            if(player.curAnim() !== "walk-side") player.play("walk-side");
            player.direction = "right";
            return;
        }

        if (Math.abs(mouseAngle) < lwBound){
            player.flipX = true;
            if(player.curAnim() !== "walk-side") player.play("walk-side");
            player.direction = "left";
            return;
        }




    });


    k.onMouseRelease(()=> {

        if(player.direction === "down"){
            player.play("idle-down");
            return;
        }

        if(player.direction === "up"){
            player.play("idle-up");
            return;
        }
        
        player.play("idle-side");

    });

});

k.go("main");


class Modal{
    constructor(modal){
        this.modal = modal;
        this.attachEventListeners();
    }

    openModal(){
        this.modal.removeAttribute('hidden');
        this.modal.classList.add('active');
    }

    closeModal(){
        modalTracker.style.transition = 'none';
        isMoving = false;

        document.querySelector('.modal__overlay').style.opacity = 1;

        this.modal.setAttribute('hidden', true);
        this.modal.classList.remove('active');
        player.isInDialogue = false;
    }

    attachEventListeners(){
        this.modal.addEventListener('click', (e) => {
            // console.log(e.target.classList);
            e.target === e.currentTarget || e.target.classList.contains('modal__close') ? this.closeModal() : null;
        })
    }
}





const modal = new Modal(modalContainer);
// modal.openModal();
// console.log(modal);



function addArrowEventListeners(){
    document.querySelectorAll('.modal__arrow').forEach(
        (arrow) => arrow.addEventListener('click', (e) => {
            if(isMoving === true) {return}
            isMoving = true;
            modalTracker.style.transition = `transform ${transitionSpeed}ms cubic-bezier(0.82, 0.02, 0.39, 1.01)`;
            e.target.id === 'right' ? currentIndex++ : currentIndex--;
            moveGallery();
        }))
}


function addIndicatorEventListeners(){
    indicatorContainer.addEventListener('click', (e) => {
       if(e.currentTarget === e.target) {return}
            if(isMoving === true) {return}
            isMoving = true;
            modalTracker.style.transition = `transform ${transitionSpeed}ms cubic-bezier(0.82, 0.02, 0.39, 1.01)`;
            currentIndex = parseInt(e.target.dataset.index) + 1;
            console.log('currentIndex:', currentIndex);
            moveGallery();
    })
}

function addTransitionEndListener(){
    modalTracker.addEventListener('transitionend', () => {
        isMoving = false;

        if(currentIndex === 0) {
            modalTracker.style.transition = 'none';
            currentIndex = lastIndex - 2;
            moveGallery();
        }

        if(currentIndex === lastIndex - 1) {
            modalTracker.style.transition = 'none';
            currentIndex = 1;
            moveGallery();
        }
    })
}


window.addEventListener('keyup', (e) => {
    if (e.key === "Escape" && modalContainer.classList.contains('active')){
        modal.closeModal();  
    }
})


function AddImgandIndtoGallery(currentGallery){
    modalTracker.innerHTML = [currentGallery[currentGallery.length -1],...currentGallery, currentGallery[0]].map((img) => `<img class = "modal__image" src="${img.src}" alt = "${img.alt}"  width = "300" height = "400" >`).join('')
    indicatorContainer.innerHTML = currentGallery.map((i, index) => `<button class="modal__indicator" data-index = "${index}"></button>`).join('');
    return [[...document.querySelectorAll('.modal__image')], [...document.querySelectorAll('.modal__indicator')]];
}

function showActiveIndicator(){
    modalIndicators.forEach((i) => i.classList.remove('active'));
    switch(currentIndex){
        case 0:
          modalIndicators[modalIndicators.length - 1].classList.add('active');
          break;
        case lastIndex - 1:
          modalIndicators[0].classList.add('active');
          break;
        default:
          modalIndicators.find((i) => i.dataset.index == currentIndex - 1).classList.add('active');
          break;
      }
}

function moveGallery(){
    modalTracker.style.transform = `translateX(${currentIndex * -100}%)`;
    showActiveIndicator();
}



export default async function initGallery(endpoint, options){
    await fetch(endpoint)
    .then((response)=> {
        if(!response.ok){
            throw new Error('Network response was not ok');
        }
        console.log(response);
        return response.json();

    })
    .then((data) => {
        galleries = data;
        console.log(galleries)
        transitionSpeed = options?.speed || 250;
        // console.log(transitionSpeed);
        addArrowEventListeners();
        addIndicatorEventListeners();
        addTransitionEndListener();
    })
    .catch((error) => {
        console.error('Fetch operation failed: ', error)
    });
}

