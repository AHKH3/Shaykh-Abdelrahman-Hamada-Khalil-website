const canvas = document.getElementById('interactive-bg');
if (canvas) {
    const ctx = canvas.getContext('2d');

    let particlesArray;

    // get mouse position
    let mouse = {
        x: null,
        y: null,
        radius: (canvas.height/120) * (canvas.width/120)
    }

    // تفاعل مع حركة المؤشر على window
    window.addEventListener('mousemove', function(event) {
        mouse.x = event.x;
        mouse.y = event.y;
        for (let i = 0; i < particlesArray.length; i++) {
            let dx = mouse.x - particlesArray[i].x;
            let dy = mouse.y - particlesArray[i].y;
            let dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < 120) {
                particlesArray[i].directionX += dx * 0.0005;
                particlesArray[i].directionY += dy * 0.0005;
            }
        }
    });

    // تطوير الخلفية: إضافة مضلعات سداسية مع الدوائر، وتدرجات ألوان الشعار
    const HEXAGON_SIDES = 6;
    function drawHexagon(x, y, size, color) {
        ctx.save();
        ctx.beginPath();
        for (let i = 0; i < HEXAGON_SIDES; i++) {
            let angle = (Math.PI * 2 / HEXAGON_SIDES) * i;
            let px = x + size * Math.cos(angle);
            let py = y + size * Math.sin(angle);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = color;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.restore();
    }

    // دالة رسم نجمة ثمانية
    function drawStar(x, y, size, color) {
        ctx.save();
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            let angle = (Math.PI / 4) * i;
            let r = i % 2 === 0 ? size : size / 2.2;
            let px = x + r * Math.cos(angle);
            let py = y + r * Math.sin(angle);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        // تدرج لوني
        let grad = ctx.createRadialGradient(x, y, size * 0.2, x, y, size);
        grad.addColorStop(0, color);
        grad.addColorStop(1, 'rgba(255,255,255,0.1)');
        ctx.fillStyle = grad;
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
        ctx.globalAlpha = 0.32;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.restore();
    }

    // تحديث كلاس Particle: إزالة خاصية lifetime
    class Particle {
        constructor(x, y, directionX, directionY, size, color, shape) {
            this.x = x;
            this.y = y;
            this.directionX = directionX;
            this.directionY = directionY;
            this.size = size;
            this.color = color;
            this.shape = shape; // 'circle' or 'hexagon' or 'star'
            // this.lifetime = 0;
            // this.maxLifetime = 600;
            // تأثير glow لبعض الأشكال
            this.glow = Math.random() > 0.7;
            // تدرج لوني لبعض الدوائر
            this.gradient = Math.random() > 0.5;
        }
        draw() {
            if (this.shape === 'hexagon') {
                ctx.save();
                if (this.glow) {
                    ctx.shadowColor = this.color;
                    ctx.shadowBlur = 18;
                }
                drawHexagon(this.x, this.y, this.size * 2.5, this.color);
                ctx.restore();
            } else if (this.shape === 'star') {
                drawStar(this.x, this.y, this.size * 2.7, this.color);
            } else {
                ctx.save();
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * (this.gradient ? 1.5 : 1), 0, Math.PI * 2, false);
                if (this.gradient) {
                    let grad = ctx.createRadialGradient(this.x, this.y, this.size * 0.2, this.x, this.y, this.size * 1.5);
                    grad.addColorStop(0, this.color);
                    grad.addColorStop(1, 'rgba(255,255,255,0.08)');
                    ctx.fillStyle = grad;
                } else {
                    ctx.fillStyle = this.color;
                }
                if (this.glow) {
                    ctx.shadowColor = this.color;
                    ctx.shadowBlur = 14;
                }
                ctx.globalAlpha = 0.22 + Math.random() * 0.18;
                ctx.fill();
                ctx.globalAlpha = 1;
                ctx.restore();
            }
        }
        update() {
            if (this.x > canvas.width || this.x < 0) this.directionX = -this.directionX;
            if (this.y > canvas.height || this.y < 0) this.directionY = -this.directionY;
            let dx = mouse.x - this.x;
            let dy = mouse.y - this.y;
            let distance = Math.sqrt(dx*dx + dy*dy);
            if (distance < mouse.radius + this.size * 2) {
                this.x += dx * 0.01;
                this.y += dy * 0.01;
            }
            this.x += this.directionX;
            this.y += this.directionY;
            // this.lifetime++;
            this.draw();
        }
    }

    // تحديث init لإضافة النجمة وتكبير بعض الأشكال
    function init() {
        particlesArray = [];
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        let numberOfParticles = (canvas.height * canvas.width) / 11000;
        for (let i = 0; i < numberOfParticles; i++) {
            let size = (Math.random() * 2.5) + 2.5; // تكبير الحجم قليلاً
            let x = (Math.random() * ((canvas.width - size * 2) - (size * 2)) + size * 2);
            let y = (Math.random() * ((canvas.height - size * 2) - (size * 2)) + size * 2);
            let directionX = (Math.random() * 0.3) - 0.15;
            let directionY = (Math.random() * 0.3) - 0.15;
            let color = Math.random() > 0.5 ? 'rgba(212, 175, 55, 0.7)' : 'rgba(26, 62, 99, 0.5)';
            let shapeRand = Math.random();
            let shape = shapeRand > 0.85 ? 'star' : (shapeRand > 0.6 ? 'hexagon' : 'circle');
            particlesArray.push(new Particle(x, y, directionX, directionY, size, color, shape));
        }
    }

    // تفاعل مع الضغط على window
    window.addEventListener('click', function(event) {
        for (let i = 0; i < 8; i++) {
            let size = (Math.random() * 2) + 2;
            let x = event.x + (Math.random()-0.5)*60;
            let y = event.y + (Math.random()-0.5)*60;
            let directionX = (Math.random() * 0.6) - 0.3;
            let directionY = (Math.random() * 0.6) - 0.3;
            let color = Math.random() > 0.5 ? 'rgba(212, 175, 55, 0.8)' : 'rgba(26, 62, 99, 0.7)';
            let shape = Math.random() > 0.6 ? 'hexagon' : 'circle';
            particlesArray.push(new Particle(x, y, directionX, directionY, size, color, shape));
        }
        // حد أقصى لعدد الأشكال
        const MAX_PARTICLES = 120;
        if (particlesArray.length > MAX_PARTICLES) {
            particlesArray.splice(0, particlesArray.length - MAX_PARTICLES);
        }
    });

    // تحديث دالة animate لحذف الأشكال المنتهية العمر
    function animate() {
        requestAnimationFrame(animate);
        ctx.clearRect(0,0,canvas.width, canvas.height);
        // لا تحذف الأشكال تلقائيًا
        for (let i = 0; i < particlesArray.length; i++) {
            particlesArray[i].update();
        }
        connect();
    }

    // check if particles are close enough to draw a line between them
    function connect(){
        let opacityValue = 1;
        const MAX_CONNECTED = 30;
        let connectedCount = 0;
        for (let a = 0; a < particlesArray.length; a++) {
            for (let b = a; b < particlesArray.length; b++) {
                if (connectedCount >= MAX_CONNECTED) return;
                let distance = ((particlesArray[a].x - particlesArray[b].x) * (particlesArray[a].x - particlesArray[b].x))
                + ((particlesArray[a].y - particlesArray[b].y) * (particlesArray[a].y - particlesArray[b].y));
                if (distance < (canvas.width/8) * (canvas.height/8)) {
                    opacityValue = 1 - (distance/20000);
                    ctx.strokeStyle='rgba(212, 175, 55, ' + opacityValue + ')'; // --bright-gold
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                    ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                    ctx.stroke();
                    connectedCount++;
                }
            }
        }
    }

    // resize event
    window.addEventListener('resize',
        function(){
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            mouse.radius = ((canvas.height/120) * (canvas.width/120));
            init();
        }
    );

    // mouse out event
    window.addEventListener('mouseout',
        function(){
            mouse.x = undefined;
            mouse.y = undefined;
        }
    );

    init();
    animate();
}