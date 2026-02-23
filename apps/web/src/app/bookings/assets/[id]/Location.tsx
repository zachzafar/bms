'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/api/publicClient';
import { toast } from 'sonner';
import { SelectAsset } from '@repo/api-contract';
import { MapPin, Search, Trash2 } from 'lucide-react';

const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] bg-muted rounded-md flex items-center justify-center text-muted-foreground text-sm">
      Loading map...
    </div>
  ),
});

interface LocationState {
  lat: number | null;
  lng: number | null;
  address: string;
}

function Location({ asset }: { asset: SelectAsset }) {
  const [location, setLocation] = useState<LocationState>({ lat: null, lng: null, address: '' });
  const [initialLocation, setInitialLocation] = useState<LocationState>({ lat: null, lng: null, address: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { data: locationData, refetch } = authClient.assets.getAssetLocation.useQuery({
    queryKey: ['assetLocation', asset.id],
    queryData: { params: { assetId: asset.id } },
  });

  useEffect(() => {
    if (locationData?.status === 200 && locationData.body) {
      const loc = locationData.body;
      const loaded: LocationState = {
        lat: loc.lat ? Number(loc.lat) : null,
        lng: loc.lng ? Number(loc.lng) : null,
        address: loc.address ?? '',
      };
      setLocation(loaded);
      setInitialLocation(loaded);
    }
  }, [locationData]);

  const hasChanges =
    location.lat !== initialLocation.lat ||
    location.lng !== initialLocation.lng ||
    location.address !== initialLocation.address;

  const existingLocation = locationData?.status === 200 ? locationData.body : null;

  const { mutate: setAssetLocation } = authClient.assets.setAssetLocation.useMutation({
    onSuccess: () => {
      toast.success('Location saved');
      setIsSaving(false);
      refetch();
      setInitialLocation(location);
    },
    onError: () => {
      toast.error('Failed to save location');
      setIsSaving(false);
    },
  });

  const { mutate: deleteAssetLocation } = authClient.assets.deleteAssetLocation.useMutation({
    onSuccess: () => {
      toast.success('Location removed');
      const empty = { lat: null, lng: null, address: '' };
      setLocation(empty);
      setInitialLocation(empty);
      refetch();
    },
    onError: () => {
      toast.error('Failed to remove location');
    },
  });

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      if (data.display_name) {
        setLocation({ lat, lng, address: data.display_name });
      } else {
        setLocation(prev => ({ ...prev, lat, lng }));
      }
    } catch {
      setLocation(prev => ({ ...prev, lat, lng }));
    }
  }, []);

  const handleMarkerMove = useCallback(
    (lat: number, lng: number) => {
      reverseGeocode(lat, lng);
    },
    [reverseGeocode]
  );

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      if (data.length > 0) {
        const { lat, lon, display_name } = data[0];
        setLocation({ lat: Number(lat), lng: Number(lon), address: display_name });
      } else {
        toast.error('Address not found');
      }
    } catch {
      toast.error('Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSave = () => {
    if (location.lat === null || location.lng === null) {
      toast.error('Click the map to set a location first');
      return;
    }
    setIsSaving(true);
    setAssetLocation({
      params: { assetId: asset.id },
      body: {
        address: location.address || null,
        lat: location.lat,
        lng: location.lng,
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Location</CardTitle>
        <CardDescription>
          Set the physical location of this asset. Click the map or drag the marker to position it, or search for an address.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Address search */}
        <div className="space-y-2">
          <Label>Search Address</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Search for an address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button variant="outline" onClick={handleSearch} disabled={isSearching}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Map */}
        <div className="rounded-md overflow-hidden border">
          <LeafletMap
            lat={location.lat}
            lng={location.lng}
            onMarkerMove={handleMarkerMove}
          />
        </div>

        {/* Address field */}
        <div className="space-y-2">
          <Label>Address</Label>
          <Input
            placeholder="Address will auto-fill when you place a marker"
            value={location.address}
            onChange={(e) => setLocation(prev => ({ ...prev, address: e.target.value }))}
          />
        </div>

        {/* Coordinates */}
        {location.lat !== null && location.lng !== null && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {hasChanges && (
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Location'}
            </Button>
          )}
          {existingLocation && (
            <Button variant="destructive" size="sm" onClick={() => deleteAssetLocation({ params: { assetId: asset.id } })}>
              <Trash2 className="h-4 w-4 mr-1" />
              Remove Location
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default Location;
