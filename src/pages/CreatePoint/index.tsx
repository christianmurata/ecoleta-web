import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { LeafletMouseEvent } from 'leaflet';
import { Map, TileLayer, Marker } from 'react-leaflet';

import './style.css'
import logo from '../../assets/logo.svg';
import api from '../../services/api';
import ibge from '../../services/ibge';
import Dropzone from '../../components/Dropzone';

interface Item {
    id: number;
    title: string;
    image_url: string
}

interface UF {
    sigla: string;
}

interface City {
    nome: string;
}

const CreatePoint = () => {
    const history = useHistory();

    const [ufs, setUfs] = useState<string[]>([]);
    const [items, setItems] = useState<Item[]>([]);
    const [cities, setCities] = useState<string[]>([]);
    
    const [initialPosition, setInitialPosition] = useState<[number, number]>([0, 0]);

    const [selectedUF, setSelectedUF] = useState('0');
    const [selectedCity, setSelectedCity] = useState('0');
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [selectedPosition, setSelectedPosition] = useState<[number, number]>([0, 0]);
    const [selectedFile, setSelectedFile] = useState<File>();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        whatsapp: ''
    })

    useEffect(() =>{
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;

            setInitialPosition([latitude, longitude]);
        });
    }, []);

    useEffect(() => {
        api.get('items')
        
        .then(response => {
            setItems(response.data);
        })
        
        .catch(error => console.error(error));
        
    }, []);

    useEffect(() => {
        // carrega todas as UFS
        ibge.get<UF[]>('estados')

        .then(response => {
            const siglas = response.data.map(uf => uf.sigla);

            setUfs(siglas);
        })

        .catch(error => console.error(error));

    }, []);

    useEffect(() => {
        if(selectedUF === '0')
            return;

        ibge.get<City[]>(`estados/${selectedUF}/municipios`)

        .then(response => {
            const names = response.data.map(city => city.nome);

            setCities(names);
        })

        .catch(error => console.error(error));

    }, [selectedUF]);

    function handleSelectUf(event:  ChangeEvent <HTMLSelectElement>) {
        const uf = event.target.value;

        setSelectedUF(uf);
    }

    function handleSelectCity(event:  ChangeEvent <HTMLSelectElement>) {
        const city = event.target.value;

        setSelectedCity(city);
    }

    function handleSelectItem(id: number) {
        const selected = selectedItems.findIndex(item => item === id);

        if(selected >=0)
            setSelectedItems(selectedItems.filter(item => item !== id));

        else
            setSelectedItems([ ...selectedItems, id ]);
    }

    function handleClickMap(event: LeafletMouseEvent) {
        setSelectedPosition([event.latlng.lat, event.latlng.lng]);
    }

    function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
        const { name, value } = event.target;
        
        setFormData({ ...formData, [name]: value });
    }

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();

        const { name, email, whatsapp } = formData;
        const uf = selectedUF;
        const city = selectedCity;
        const [latitude, longitude] = selectedPosition;
        const items = selectedItems;
        
        const data = new FormData();

        data.append('name', name);
        data.append('email', email);
        data.append('whatsapp', whatsapp);
        data.append('uf', uf);
        data.append('city', city);
        data.append('latitude', String(latitude));
        data.append('longitude', String(longitude));
        data.append('items', items.join(','));

        if(selectedFile) {
            data.append('image', selectedFile);
        }
        
        await api.post('points', data);

        alert('Ponto de coleta criado!');

        history.push('/');
    }

    return (
        <div id="page-create-point">
            <header>
                <img src={logo} alt="Ecoleta"/>

                <Link to="/">
                    <FiArrowLeft />
                    Voltar para Home
                </Link>
            </header>

            <form onSubmit={handleSubmit}>
                <h1>Cadastro do <br /> ponto de coleta </h1>

                <Dropzone onFileUploaded={setSelectedFile} />

                <fieldset>
                    <legend>
                        <h2> Dados </h2>
                    </legend>

                    <div className="field">
                        <label htmlFor="name">Nome da entidade</label>
                        <input type="text" name="name" id="name" onChange={ handleInputChange }/>
                    </div>

                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="email">Email</label>
                            <input type="text" name="email" id="email" onChange={ handleInputChange }/>
                        </div>

                        <div className="field">
                            <label htmlFor="whatsapp">Whatsapp</label>
                            <input type="text" name="whatsapp" id="whatsapp" onChange={ handleInputChange }/>
                        </div>
                    </div>
                </fieldset>

                <fieldset>
                    <legend>
                        <h2> Endereço </h2>
                        <span>Selecione o endereço no Mapa</span>
                    </legend>

                    <Map center={ initialPosition } zoom={15} onClick={handleClickMap}>
                        <TileLayer
                            attribution='&copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        <Marker position={selectedPosition} />
                    </Map>

                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="uf">Estado</label>
                            <select name="uf" id="uf" value={selectedUF} onChange={handleSelectUf}>
                                <option value="0">Selecione uma UF</option>
                            
                                {
                                    ufs.map(uf => (
                                        <option key={uf} value={uf}>{uf}</option>
                                    ))
                                }
                            </select>
                        </div>

                        <div className="field">
                            <label htmlFor="city">Cidade</label>
                            <select name="city" id="city" value={selectedCity} onChange={handleSelectCity}>
                                <option value="0">Selecione uma Cidade</option>
                            
                                {
                                    cities.map(city => (
                                        <option key={city} value={city}>{city}</option>
                                    ))
                                }
                            </select>
                        </div>
                    </div>
                </fieldset>

                <fieldset>
                    <legend>
                        <h2> Ítens de Coleta </h2>
                        <span>Selecione um ou mais ítens abaixo</span>
                    </legend>

                    <ul className="items-grid">
                        { 
                            items.map(item => (
                                <li 
                                    key={item.id} 
                                    onClick={() => handleSelectItem(item.id)}
                                    className={ selectedItems.includes(item.id) ? 'selected' : '' }
                                >
                                    <img src={item.image_url} alt={item.title} />
                                    <span>{item.title}</span>
                                </li>
                            )) 
                        }
                    </ul>
                </fieldset>

                <button type="submit">Salvar Ponto de Coleta</button>
            </form>
        </div>
    );
}

export default CreatePoint;