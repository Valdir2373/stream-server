package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"image/jpeg"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gorilla/websocket"
	"github.com/kbinani/screenshot"
)




type Message struct {
	ID      *string `json:"id,omitempty"` 
	Message string  `json:"message"`
}

var FRAME_DELIMITER = []byte{0xFF, 0xDA, 0xBE, 0xEF, 0xCA, 0xFE, 0x00, 0x01}

const WS_URL = "ws://localhost:1090/ws" 

func main() {
	log.Println("Go Client: Iniciando aplicação de captura e cliente WebSocket...")

	
	conn, _, err := websocket.DefaultDialer.Dial(WS_URL, nil)
	if err != nil {
		log.Fatalf("Go Client: Falha ao conectar ao servidor WebSocket: %v", err)
	}
	defer conn.Close()
	log.Println("Go Client: Conectado ao servidor WebSocket.")

	
	
	
	

	
	
	
	
	
	
	

	
	initialMsg := Message{
		id:      idStream, 
		Message: "CAPTURE_CLIENT_CONNECT",
	}

	jsonMessage, err := json.Marshal(initialMsg) 
	if err != nil {
		log.Printf("Go Client: Erro ao serializar JSON inicial: %v", err)
		return
	}

	err = conn.WriteMessage(websocket.TextMessage, jsonMessage) 
	if err != nil {
		log.Printf("Go Client: Erro ao enviar JSON inicial: %v", err)
		return
	}
	log.Printf("Go Client: JSON inicial enviado: %s", jsonMessage)

	
	interrupt := make(chan os.Signal, 1)
	signal.Notify(interrupt, os.Interrupt, syscall.SIGTERM)

	done := make(chan struct{})

	
	go func() {
		defer close(done)
		for {
			_, message, err := conn.ReadMessage()
			if err != nil {
				if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
					log.Printf("Go Client: Erro de leitura WebSocket: %v", err)
				} else {
					log.Println("Go Client: Conexão WebSocket fechada.")
				}
				return
			}
			log.Printf("Go Client: Mensagem do servidor: %s", message)
		}
	}()

	
	ticker := time.NewTicker(time.Millisecond * 16) 
	defer ticker.Stop()

	log.Println("Go Client: Iniciando captura de tela e envio...")

	for {
		select {
		case <-done:
			log.Println("Go Client: Goroutine de leitura encerrada, finalizando captura.")
			return
		case <-interrupt:
			log.Println("Go Client: Sinal de interrupção recebido. Fechando conexão WebSocket...")
			err := conn.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.CloseNormalClosure, ""))
			if err != nil {
				log.Printf("Go Client: Erro ao enviar CloseMessage: %v", err)
				return
			}
			select {
			case <-done:
			case <-time.After(time.Second):
			}
			log.Println("Go Client: Aplicação encerrada.")
			return
		case <-ticker.C:
			n := screenshot.NumActiveDisplays()
			if n == 0 {
				continue
			}

			bounds := screenshot.GetDisplayBounds(0)
			img, err := screenshot.CaptureRect(bounds)
			if err != nil {
				log.Println("Go Client: Erro ao capturar tela:", err)
				continue
			}

			var buf bytes.Buffer
			err = jpeg.Encode(&buf, img, &jpeg.Options{Quality: 70})
			if err != nil {
				log.Println("Go Client: Erro ao codificar JPEG:", err)
				continue
			}

			frameData := append(buf.Bytes(), FRAME_DELIMITER...)

			err = conn.WriteMessage(websocket.BinaryMessage, frameData)
			if err != nil {
				log.Printf("Go Client: Erro ao enviar frame via WebSocket: %v", err)
				return
			}
		}
	}
}