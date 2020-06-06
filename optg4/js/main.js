// Ссылка на элемент веб страницы в котором будет отображаться графика 
var container; 

var keyboard = new THREEx.KeyboardState(); 
 
// Переменные "камера", "сцена" и "отрисовщик" 
var camera, scene, renderer;

var geometry;

var clock = new THREE.Clock();

var N = 256;

var Cursor3D;

var mouse = { x: 0, y: 0 }; //переменная для хранения координат мыши
//массив для объектов, проверяемых на пересечение с курсором
var targetList = []; 

var circle;

var radius = 10;

var brushDirection = 0;

//объект интерфейса и его ширина
var gui = new dat.GUI();
gui.width = 200;

var brVis = false;

//var models = [];
//var models = {};
var models = new Map();

var selected = null;//ccskrf yf ds,hfyysq j,]trn
var objectList = []; 



// Функция инициализации камеры, отрисовщика, объектов сцены и т.д. 
init(); 
 
// Обновление данных по таймеру браузера 
animate(); 

// В этой функции можно добавлять объекты и выполнять их первичную настройку 
function init()  
{     
    // Получение ссылки на элемент html страницы     
    container = document.getElementById( 'container' );     
    // Создание "сцены"     
    scene = new THREE.Scene(); 
 
    // Установка параметров камеры     
    // 45 - угол обзора     
    // window.innerWidth / window.innerHeight - соотношение сторон     // 1 - 4000 - ближняя и дальняя плоскости отсечения     
    camera = new THREE.PerspectiveCamera(                                  
        45, window.innerWidth / window.innerHeight, 1, 4000 );     
 
    // Установка позиции камеры     
    camera.position.set(N/2, N/2, N*1.5);          
    // Установка точки, на которую камера будет смотреть     
    camera.lookAt(new THREE.Vector3( N/2,  0.0, N/2));   
 
    // Создание отрисовщика     
    renderer = new THREE.WebGLRenderer( { antialias: false } );     
    renderer.setSize( window.innerWidth, window.innerHeight );     
    // Закрашивание экрана синим цветом, заданным в 16ричной системе     
    renderer.setClearColor( 0x444444, 1); 

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
 
    container.appendChild( renderer.domElement ); 
 
    // Добавление функции обработки события изменения размеров окна     
    window.addEventListener( 'resize', onWindowResize, false );

    renderer.domElement.addEventListener('mousedown',onDocumentMouseDown,false);
    renderer.domElement.addEventListener('mouseup',onDocumentMouseUp,false);
    renderer.domElement.addEventListener('mousemove',onDocumentMouseMove,false);
    renderer.domElement.addEventListener('wheel',onDocumentMouseScroll,false);

    renderer.domElement.addEventListener("contextmenu",
                                        function (event)
                                        {
                                        event.preventDefault();
                                        });
    
    //свет
    var spotlight = new THREE.DirectionalLight(0xffffff);
    //var spotlight = new THREE.PointLight(0xffff00);
    //position
    spotlight.position.set(N, N, N/2);


    //var targetObject = new THREE.Object3D();
    spotlight.target = new THREE.Object3D();
    spotlight.target.position.set( N/2, 0, N/2 );
    scene.add(spotlight.target);

    //spotlight.target = targetObject;
   
    // направление освещения
    //spotlight.target.position.set( 0, 0, 0 );
    //scene.add(spotlight.target);

    // включение расчёта теней
    spotlight.castShadow = true;
    // параметры области расчёта теней
    ////spotlight.shadow.camera.near = 500;
    ////spotlight.shadow.camera.far = 4000;
    ////spotlight.shadow.camera.fov = 45;

    spotlight.shadow = new THREE.LightShadow( 
        new THREE.PerspectiveCamera( 60, 1, 10, 1000 ) );
        spotlight.shadow.bias = 0.0001;


    // размер карты теней
    spotlight.shadow.mapSize.width = 4096;
    spotlight.shadow.mapSize.height = 4096;

    //add
    scene.add(spotlight);
    //scene.add(pspotlight);

    var helper = new THREE.CameraHelper(spotlight.shadow.camera);
    //scene.add( helper );

    // Пользовательская функция генерации ландшафта     
    terrainGen(); 
    add3DCursor();
    addCircle();

    GUI();

    
    loadModel('models/house/', 'Cyprys_House.obj', 'Cyprys_House.mtl', 1, 'house')
    loadModel('models/palma/', 'Palma001.obj', 'Palma001.mtl', 0.2, 'palma')
    loadModel('models/grade/', 'grade.obj', 'grade.mtl', 1, 'grade')

}

function terrainGen()
{
    geometry = new THREE.Geometry();
 
    for (var i=0; i < N; i++)
    for (var j=0; j < N; j++)
    {
        //color
        //var h = getPixel(imagedata, i, j);

        //add coordination in massiv
        geometry.vertices.push(new THREE.Vector3(i, 0.0, j));
    }

    for (var i = 0; i < (N-1); i++)
        for (var j = 0; j < (N-1); j++)
        {
            //add
            geometry.faces.push(new THREE.Face3(i+j*N, (i+1)+j*N, (i+1)+(j+1)*N));
            geometry.faces.push(new THREE.Face3(i+j*N, (i+1)+(j+1)*N, (i)+(j+1)*N));

            geometry.faceVertexUvs[0].push([
                new THREE.Vector2((i)/(N-1), (j)/(N-1)),
                new THREE.Vector2((i+1)/(N-1), (j)/(N-1)),
                new THREE.Vector2((i+1)/(N-1), (j+1)/(N-1))]);

            geometry.faceVertexUvs[0].push([
                new THREE.Vector2((i)/(N-1), (j)/(N-1)),
                new THREE.Vector2((i+1)/(N-1), (j+1)/(N-1)),
                new THREE.Vector2((i)/(N-1), (j+1)/(N-1))]);
        }
        
    geometry.computeFaceNormals();  
    geometry.computeVertexNormals();    
   
    var loader = new THREE.TextureLoader();
    var tex = loader.load( 'pics/grasstile.jpg' );

    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4);
        
    var mat = new THREE.MeshLambertMaterial
    ({    
        map: tex,    
        wireframe: false,    
        side: THREE.DoubleSide 
    });
 
    var mesh = new THREE.Mesh(geometry, mat); 
    mesh.position.set(0.0, 0.0, 0.0);


    mesh.receiveShadow = true;

    //добавление в массив плоскость (ландшафт)
    targetList.push(mesh);
    scene.add(mesh);

}

function onWindowResize()
{
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
}

function animate()
{
    // воспроизведение анимаций (в функции animate)
    var delta = clock.getDelta();

    if (brushDirection != 0)
    {
        sphereBrush(brushDirection, delta);
    }
    // Добавление функции на вызов, при перерисовки браузером страницы 
    requestAnimationFrame( animate ); 

    render(); 
}

function render()
{        
    renderer.render( scene, camera );
}


function loadModel(path, oname, mname, s, name)
{
    // функция, выполняемая в процессе загрузки модели (выводит процент загрузки)
    var onProgress = function ( xhr ) {
        if ( xhr.lengthComputable ) {
            var percentComplete = xhr.loaded / xhr.total * 100;
            console.log( Math.round(percentComplete, 2) + '% downloaded' );
        }
    };
    // функция, выполняющая обработку ошибок, возникших в процессе загрузки
    var onError = function ( xhr ) { };

    // функция, выполняющая обработку ошибок, возникших в процессе загрузки
    var mtlLoader = new THREE.MTLLoader();
    mtlLoader.setPath( path );

    // функция загрузки материала
    mtlLoader.load( mname, function( materials )
    {
        materials.preload();
        var objLoader = new THREE.OBJLoader();
        objLoader.setMaterials( materials );
        
        objLoader.setPath( path );
 
        // функция загрузки модели
        objLoader.load( oname, function ( object )
        {
            //mesh.receiveShadow = true; //принимает 
            object.castShadow = true; //только отбрасывает
            //console.log(object);

            object.traverse( function ( child )
            {
                if ( child instanceof THREE.Mesh )
                {
                    child.castShadow = true;
                    child.parent = object;
                }
            } );

            //for (var i=0; i < 100; i++)
            //{
                object.parent = object;
                var x = Math.random() * 256;
                var z = Math.random() * 256;

                var y = geometry.vertices[ Math.round(z) + Math.round(x) * N ].y;

                object.position.x = x;
                object.position.y = y;
                object.position.z = z;
    
                //object.scale.set(1, 1, 1);
                //object.scale.set(0.2, 0.2, 0.2);
                ///var s = (Math.random() * 100) + 30
                ///s /= 400.0;
                object.scale.set(s, s, s);
    

                //scene.add(object);
                //clone
                //scene.add(object.clone());
            //}

                //models.add(name, object)
                models.set(name, object)
                //models.push(object);
            

        }, onProgress, onError );
    });
}

function add3DCursor ()
{
    //параметры цилиндра: диаметр вершины, диаметр основания, высота, число сегментов
    var geometry = new THREE.CylinderGeometry( 1.5, 0, 5, 64 );
    var cyMaterial = new THREE.MeshLambertMaterial( {color: 0x888888} );
    Cursor3D = new THREE.Mesh( geometry, cyMaterial );
    Cursor3D.visible = false;
    scene.add( Cursor3D );
}

function addCircle()
{
    var material = new THREE.LineBasicMaterial( { color: 0xffff00 } );
    
    var segments = 64;
    var circleGeometry = new THREE.CircleGeometry( 1, segments );
    //удаление центральной вершины
    circleGeometry.vertices.shift();


    for (var i=0; i<circleGeometry.vertices.length; i++)
    {
        circleGeometry.vertices[i].z = circleGeometry.vertices[i].y;
        circleGeometry.vertices[i].y = 0;
    }

    circle = new THREE.Line( circleGeometry, material );

    //circle.rotation.x = Math.PI/2;
    circle.scale.set(radius, 1, radius);

    circle.visible = false;

    scene.add( circle ); 
}

function onDocumentMouseScroll( event ) 
{
    if (brVis == true)
    {
        if (radius>1)
            if(event.wheelDelta < 0)
                radius --;

        if (radius<40)
            if(event.wheelDelta > 0)
                radius ++;        

        circle.scale.set(radius, 1, radius);
    }
}

function onDocumentMouseMove( event ) 
{
    //определение позиции мыши
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = -( event.clientY / window.innerHeight ) * 2 + 1;

    //создание луча, исходящего из позиции камеры и проходящего сквозь позицию курсора мыши
    var vector = new THREE.Vector3( mouse.x, mouse.y, 1 );
    vector.unproject(camera);

    var ray = new THREE.Raycaster( camera.position,
        vector.sub( camera.position ).normalize() );
    
    // создание массива для хранения объектов, с которыми пересечётся луч
    var intersects = ray.intersectObjects( targetList );

    if (brVis == true)
    {
        // если луч пересёк какой-либо объект из списка targetList
        if ( intersects.length > 0 )
        {
            //печать списка полей объекта
            //console.log(intersects[0]);

            if (Cursor3D != null)
            {
                Cursor3D.position.copy(intersects[0].point);
                Cursor3D.position.y += 2.5;
            }

            if (circle != null)
            {
                circle.position.copy(intersects[0].point);
                //circle.position.y += 0.1;
                circle.position.y = 0;

                for (var i = 0; i < circle.geometry.vertices.length; i++)
                {
                    //получение позиции в локальной системе координат
                    var pos = new THREE.Vector3();
                    pos.copy(circle.geometry.vertices[i]);
                    //нахождение позиции в глобальной системе координат
                    pos.applyMatrix4(circle.matrixWorld);

                    var x = Math.round(pos.x);
                    var z = Math.round(pos.z);

                    if(x >= 0 && x < N && z >= 0 && z < N)
                    {
                        var y = geometry.vertices[z + x * N].y;
                        circle.geometry.vertices[i].y = y + 0.03;
                    }else circle.geometry.vertices[i].y = 0;
                }

                circle.geometry.verticesNeedUpdate = true; //обновление вершин
            }
        }
    }
    else
    {
        if ( intersects.length > 0 )
        {
            if (selected != null)
                selected.position.copy(intersects[0].point);
        }
       
    }
}

function onDocumentMouseDown( event ) 
{
    if (brVis == true)
    {
        console.log(event.which);
        if (event.which == 1)
            brushDirection = 1;
        if (event.which == 3)
            brushDirection = -1;
    }
    else
    {
        //определение позиции мыши
        mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        mouse.y = -( event.clientY / window.innerHeight ) * 2 + 1;

        //создание луча, исходящего из позиции камеры и проходящего сквозь позицию курсора мыши
        var vector = new THREE.Vector3( mouse.x, mouse.y, 1 );
        vector.unproject(camera);

        var ray = new THREE.Raycaster( camera.position,
            vector.sub( camera.position ).normalize() );
        
        // создание массива для хранения объектов, с которыми пересечётся луч
        var intersects = ray.intersectObjects( objectList, true );

        // если луч пересёк какой-либо объект из списка targetList
        if ( intersects.length > 0 )
        {
            selected = intersects[0].object.parent; // yf rnh vs gjgfkb rehcjhjv vsib
            console.log(selected);
        }
    }
}

function onDocumentMouseUp( event ) 
{
    if (brVis == true)
        brushDirection = 0;
    else selected = null;
}

function sphereBrush(dir, delta)
{
    for (var i = 0; i <geometry.vertices.length; i++)
    {
        var x2 = geometry.vertices[i].x;
        var z2 = geometry.vertices[i].z;
        var r = radius;
        var x1 = Cursor3D.position.x;
        var z1 = Cursor3D.position.z;

        //ℎ = √𝑟2 − ((𝑥2 − 𝑥1)2 + (𝑧2 − 𝑧1)2)

        var h = r*r - (((x2-x1)* (x2-x1))+((z2-z1)*(z2-z1)));
        if(h > 0)
        {
            geometry.vertices[i].y += Math.sqrt(h)*delta * dir;
            //geometry.vertices[i].y += Math.sin(h)*delta * dir;
        }
    }

    geometry.computeFaceNormals();
    geometry.computeVertexNormals(); //пересчёт нормалей
    geometry.verticesNeedUpdate = true; //обновление вершин
    geometry.normalsNeedUpdate = true; //обновление нормалей
}

//2 set
function GUI()
{
    //массив переменных, ассоциированных с интерфейсом
    var params =
    {
        sx: 0, sy: 0, sz: 0,
        brush: false,
        addHouse: function() { addMesh('house') },
        addPalma: function() { addMesh('palma') },
        addGrade: function() { addMesh('grade') },
        //del: function() { delMesh() }
    };

    //создание вкладки
    var folder1 = gui.addFolder('Scale');
    //ассоциирование переменных отвечающих за масштабирование
    //в окне интерфейса они будут представлены в виде слайдера
    //минимальное значение - 1, максимальное – 100, шаг – 1
    //listen означает, что изменение переменных будет отслеживаться
    var meshSX = folder1.add( params, 'sx' ).min(1).max(100).step(1).listen();
    var meshSY = folder1.add( params, 'sy' ).min(1).max(100).step(1).listen();
    var meshSZ = folder1.add( params, 'sz' ).min(1).max(100).step(1).listen();
    //при запуске программы папка будет открыта
    folder1.open();
    //описание действий совершаемых при изменении ассоциированных значений
   //meshSX.onChange(function(value) {…});
    //meshSY.onChange(function(value) {…});
    //meshSZ.onChange(function(value) {…});
    //добавление чек бокса с именем brush
    var cubeVisible = gui.add( params, 'brush' ).name('brush').listen();

    cubeVisible.onChange(function(value)
    {
        // value принимает значения true и false
        brVis = value;
        Cursor3D.visible = value;
        circle.visible = value;
    });

    //добавление кнопок, при нажатии которых будут вызываться функции addMesh
    //и delMesh соответственно. Функции описываются самостоятельно.
    gui.add( params, 'addHouse' ).name( "add house" );
    gui.add( params, 'addPalma' ).name( "add palma" );
    gui.add( params, 'addGrade' ).name( "add grade" );
    //gui.add( params, 'del' ).name( "delete" );

    //при запуске программы интерфейс будет раскрыт
    gui.open();

}


function addMesh (name)
{
    //console.log(models.get(name));
    //scene.add(models.get(name).clone());

    var model = models.get(name).clone();

    objectList.push(model);
    scene.add(model);
}