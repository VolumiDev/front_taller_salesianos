pipeline {
    agent any

    environment {
        DOCKER_USER = 'dmartindev' 
        
        IMAGE_NAME = "${DOCKER_USER}/front-taller"
        registryCredential = 'docker-hub-credentials'
        DOCKER_BUILDKIT = '0'
        CONTAINER_NAME = 'angular-taller-deploy'
        APP_PORT = '8080'
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
                    sh "docker rmi ${IMAGE_NAME}:latest"
                    sh "docker rmi ${IMAGE_NAME}:v${BUILD_NUMBER}"
                }
            }
        }
    }
}