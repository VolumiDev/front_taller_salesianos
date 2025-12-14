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
                    echo "--- ⬇️ Descargando tests ---"
                    dir('pruebas-externas') {
                        git branch: 'main', url: 'https://github.com/VolumiDev/robot_taller_salesianos.git'
                        echo "--- 📂 Verificando descarga: ---"
                        sh "ls -R"
                    }

                    def NETWORK_NAME = "qa-network-${BUILD_NUMBER}"
                    
                    try {
                        sh "docker network create ${NETWORK_NAME}"

                        // 1. Arrancar Angular
                        sh "docker rm -f ${CONTAINER_TEST} || true"
                        sh "docker run -d --network ${NETWORK_NAME} --name ${CONTAINER_TEST} ${IMAGE_NAME}:latest"
                        
                        sleep 5

                        echo "--- 🤖 Ejecutando Robot Framework ---"
                        
                        // SOLUCIÓN DE DOBLE MONTAJE:
                        // 1. Montamos la carpeta 'tests' (plural) local -> directamente en la carpeta 'tests' del contenedor
                        // 2. Montamos la carpeta 'resources' local -> directamente en la carpeta 'resources' del contenedor
                        // 3. NO pasamos ningún argumento al final. Dejamos que Robot trabaje por defecto.
                        
                        sh """
                          docker run --rm --network ${NETWORK_NAME} \
                          -v ${WORKSPACE}/pruebas-externas/tests:/opt/robotframework/tests \
                          -v ${WORKSPACE}/pruebas-externas/resources:/opt/robotframework/resources \
                          -v ${WORKSPACE}/results:/opt/robotframework/reports \
                          ppodgorsek/robot-framework:latest
                        """

                    } catch (Exception e) {
                        currentBuild.result = 'FAILURE'
                        echo "❌ ERROR EN QA. Logs del contenedor Angular:"
                        sh "docker logs ${CONTAINER_TEST}"
                        error("Fallaron los tests de QA")
                    } finally {
                        sh "docker rm -f ${CONTAINER_TEST} || true"
                        sh "docker network rm ${NETWORK_NAME} || true"
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