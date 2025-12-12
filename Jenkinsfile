pipeline {
    agent any

    environment {
        DOCKER_USER = 'dmartindev' 
        
        IMAGE_NAME = "${DOCKER_USER}/front-taller"
        registryCredential = 'docker-hub-credentials'
        DOCKER_BUILDKIT = '0'

        // Variables para Despliegue
        CONTAINER_NAME = 'angular-taller-deploy'
        APP_PORT = '8080'

        // Variables para Test (Quality Gate)
        CONTAINER_TEST = 'angular-app-test-temp'
        PORT_TEST = '8082'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Image') {
            steps {
                script {
                    echo "--- 🔨 Construyendo imagen: ${IMAGE_NAME} ---"
                    // Construye usando el Dockerfile de la raíz
                    sh "docker build --no-cache -t ${IMAGE_NAME}:latest ."
                    // Añade una etiqueta con el número de build (v1, v2, v3...)
                    sh "docker tag ${IMAGE_NAME}:latest ${IMAGE_NAME}:v${BUILD_NUMBER}"
                }
            }
        }

        stage('Quality Gate (Robot Framework)') {
            steps {
                script {
                    echo "--- ⬇️ Descargando repositorio de QA ---"
                    
                    // 1. Clonamos TU repositorio externo en la carpeta 'pruebas-externas'
                    dir('pruebas-externas') {
                        // Sustituye con tu URL real
                        git branch: 'main', url: 'https://github.com/VolumiDev/robot_taller_salesianos'
                    }

                    echo "--- 🤖 Iniciando Tests Específicos ---"
                    try {
                        // 2. Arrancar la App Angular en puerto de Test (8082)
                        sh "docker rm -f ${CONTAINER_TEST} || true"
                        sh "docker run -d -p ${PORT_TEST}:80 --name ${CONTAINER_TEST} ${IMAGE_NAME}:latest"
                        
                        sleep 5

                        // 3. Ejecutar Robot Framework
                        // EXPLICACIÓN DE LOS CAMBIOS:
                        // -v .../pruebas-externas:/opt/robotframework/tests : Montamos TODA la raíz del repo.
                        // Al final del comando añadimos 'test' : Esto le dice a Robot "Entra en la carpeta 'test' y ejecuta eso".
                        
                        sh """
                          docker run --rm --network host \
                          -v ${WORKSPACE}/pruebas-externas:/opt/robotframework/tests \
                          -v ${WORKSPACE}/results:/opt/robotframework/reports \
                          ppodgorsek/robot-framework:latest \
                          test
                        """
                        // NOTA: Si tu carpeta se llama 'tests' (plural), cambia la última palabra por 'tests'
                        
                    } catch (Exception e) {
                        currentBuild.result = 'FAILURE'
                        error("❌ Los tests de QA fallaron.")
                    } finally {
                        sh "docker rm -f ${CONTAINER_TEST} || true"
                    }
                }
            }
        }

        stage('Push to Docker Hub') {
            steps {
                script {
                    echo "--- 🚀 Subiendo a la nube ---"
                    // Se conecta a Docker Hub usando el Token guardado en Jenkins
                    withCredentials([usernamePassword(credentialsId: registryCredential, usernameVariable: 'USERNAME', passwordVariable: 'PASSWORD')]) {
                        sh 'echo $PASSWORD | docker login -u $USERNAME --password-stdin'
                        sh "docker push ${IMAGE_NAME}:latest"
                        sh "docker push ${IMAGE_NAME}:v${BUILD_NUMBER}"
                    }
                }
            }
        }
        
        // --- ESTA ES LA ETAPA NUEVA: DESPLIEGUE ---
        stage('Deploy Local') {
            steps {
                script {
                    echo "--- 🔄 Actualizando contenedor local ---"
                    // 1. Intentamos borrar el contenedor viejo (si existe)
                    // El '|| true' hace que no falle el pipeline si es la primera vez y no existe
                    sh "docker rm -f ${CONTAINER_NAME} || true"
                    
                    // 2. Arrancamos el nuevo en el puerto 8081
                    sh "docker run -d -p ${APP_PORT}:80 --name ${CONTAINER_NAME} ${IMAGE_NAME}:latest"
                }
            }
        }

        stage('Cleanup') {
            steps {
                script {
                    echo "--- 🧹 Limpieza ---"
                    sh "docker logout"
                    // Borra la imagen del entorno de Jenkins para ahorrar espacio
                    sh "docker rmi ${IMAGE_NAME}:latest || true"
                    sh "docker rmi ${IMAGE_NAME}:v${BUILD_NUMBER} || true"
                }
            }
        }
    }
}